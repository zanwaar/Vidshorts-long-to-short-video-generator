import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Import schema if you create one
// import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be a Neon connection string');
}

const sql = neon(process.env.DATABASE_URL);

// You can pass { schema } as a second argument if you have a schema defined
export const db = drizzle(sql);
