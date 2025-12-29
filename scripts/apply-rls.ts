/**
 * Script to apply RLS policies to Supabase database
 * Run with: npx tsx scripts/apply-rls.ts
 */

import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join } from 'path';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.log('Make sure you have a .env file with DATABASE_URL');
    process.exit(1);
}

async function applyRLSPolicies() {
    console.log('📦 Connecting to database...');

    const sql = postgres(databaseUrl, {
        prepare: false,
        max: 1
    });

    try {
        // Read the SQL file
        const sqlPath = join(process.cwd(), 'src/db/migrations/0001_rls_policies.sql');
        const sqlContent = readFileSync(sqlPath, 'utf-8');

        console.log('🔐 Applying RLS policies...');

        // Execute the SQL
        await sql.unsafe(sqlContent);

        console.log('✅ RLS policies applied successfully!');

        // Verify RLS is enabled
        const result = await sql`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('profiles', 'groups', 'group_members', 'expenses', 'expense_splits', 'receipts', 'settlements', 'notifications', 'invitations')
    `;

        console.log('\n📋 RLS Status:');
        for (const row of result) {
            const status = row.rowsecurity ? '✅' : '❌';
            console.log(`   ${status} ${row.tablename}`);
        }

    } catch (error) {
        console.error('❌ Error applying RLS policies:', error);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

applyRLSPolicies();
