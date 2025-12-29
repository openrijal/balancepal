import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// For query purposes (read-only connection pooling)
const connectionString = import.meta.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
}

// Create postgres client
// Using { prepare: false } for Supabase connection pooler compatibility
const client = postgres(connectionString, { prepare: false });

// Create drizzle instance with schema for relations
export const db = drizzle(client, { schema });

// Export schema for use in other files
export * from './schema';
