import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

import { DATABASE_URL } from 'astro:env/server';

// For query purposes (read-only connection pooling)
const connectionString = DATABASE_URL;

// astro:env ensures DATABASE_URL is present, so manual check is redundant but safe to remove
// if (!connectionString) ... check is handled by Astro schema validation

// Create postgres client
// Using { prepare: false } for Supabase connection pooler compatibility
const client = postgres(connectionString, { prepare: false });

// Create drizzle instance with schema for relations
export const db = drizzle(client, { schema });

// Export schema for use in other files
export * from './schema';
