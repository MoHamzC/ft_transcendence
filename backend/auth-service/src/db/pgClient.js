// backend/auth-service/src/db/pgClient.js
import { Pool } from 'pg';

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

pool.on('error', (err) =>
{
    console.error('❌ Unexpected error on idle client', err);
    process.exit(1);
});

export default pool;
