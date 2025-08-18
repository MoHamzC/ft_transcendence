// backend/scripts/migrate.js
import fs from 'fs';
import { Pool } from 'pg';
import 'dotenv/config';

async function main()
{
    const sql = fs.readFileSync('src/db/schema.sql', 'utf8');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    await pool.query('BEGIN');
    try
    {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations(
                id serial primary key,
                applied_at timestamptz default now()
            );
        `);
        await pool.query(sql);
        await pool.query('COMMIT');
        console.log('Migrations applied.');
    }
    catch (e)
    {
        await pool.query('ROLLBACK');
        throw e;
    }
    finally
    {
        await pool.end();
    }
}
main().catch((e) =>
{
    console.error(e);
    process.exit(1);
});
