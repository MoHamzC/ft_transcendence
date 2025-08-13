// src/db/pgClient.js

/*
 importe le driver Postgres
 cree et exporte un pool de connexions

 pg est un client Postgres pour Node.js
 - il permet de se connecter a une base de donnees Postgres
 - il gere les connexions, les requetes et les transactions
 - il est asynchrone et utilise des promesses
 - il est performant et fiable
 - il est utilise par de nombreuses applications Node.js
 */

// src/db/pgClient.js
import { Pool } from 'pg';

export const pool = new Pool(
{
    connectionString: process.env.DATABASE_URL
});

// optionnel: ping au démarrage
export async function healthCheck()
{
    await pool.query('SELECT 1');
}
