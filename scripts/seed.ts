import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { profiles } from '../src/db/schema';

async function seed() {
  console.log('🌱 Starting seed process...');

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const databaseUrl = process.env.DATABASE_URL;

  if (!supabaseUrl || !serviceRoleKey || !databaseUrl) {
    console.error('❌ Missing required environment variables:');
    if (!supabaseUrl) console.error('   - SUPABASE_URL');
    if (!serviceRoleKey) console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    if (!databaseUrl) console.error('   - DATABASE_URL');
    process.exit(1);
  }

  // 1. Initialize Supabase Admin Client
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // 2. Initialize Drizzle
  const client = postgres(databaseUrl);
  const db = drizzle(client);

  const demoUser = {
    email: 'demo@balancepal.com',
    password: 'Demo@123',
    name: 'Demo User',
  };

  try {
    // 3. Check/Create User in Supabase Auth
    console.log('Checking for demo user...');

    // We try to list users to see if it exists
    const {
      data: { users },
      error: listError,
    } = await supabase.auth.admin.listUsers();

    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`);
    }

    let userId = users.find((u) => u.email === demoUser.email)?.id;

    if (!userId) {
      console.log('User not found. Creating demo user...');
      const { data, error: createError } = await supabase.auth.admin.createUser({
        email: demoUser.email,
        password: demoUser.password,
        email_confirm: true,
        user_metadata: { name: demoUser.name },
      });

      if (createError) {
        throw new Error(`Failed to create user: ${createError.message}`);
      }

      userId = data.user.id;
      console.log('✅ Demo user created in Auth.');
    } else {
      console.log('ℹ️ Demo user already exists in Auth.');
      // Update password just in case (optional, but good for demo)
      await supabase.auth.admin.updateUserById(userId, {
        password: demoUser.password,
        user_metadata: { name: demoUser.name },
      });
      console.log('ℹ️ Reset demo user password.');
    }

    // 4. Upsert Profile in Database
    console.log('Syncing profile to database...');

    await db
      .insert(profiles)
      .values({
        id: userId,
        email: demoUser.email,
        name: demoUser.name,
      })
      .onConflictDoUpdate({
        target: profiles.id,
        set: {
          email: demoUser.email,
          name: demoUser.name,
        },
      });

    console.log('✅ Profile synced successfully.');
    console.log('\n🎉 Seed completed! You can now log in with:');
    console.log(`   Email: ${demoUser.email}`);
    console.log(`   Password: ${demoUser.password}`);
  } catch (err: any) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
