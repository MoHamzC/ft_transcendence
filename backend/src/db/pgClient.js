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

import { Pool } from 'pg';

export const pool = new Pool(
{
    connectionString: process.env.DATABASE_URL
});

// log et stoppe le service si un client idle a une erreur
pool.on('error', (err) => 
{
    console.error('Unexpected error on idle client', err);
    process.exit(1);
});

export default pool;
