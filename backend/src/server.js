/*
    server.ts — 🧠 Point d’entrée principal

    C’est le fichier exécuté par ts-node-dev.

  - Initialise Fastify

  - Configure les plugins (plus tard)

  - Charge les routes via registerRoutes(app)

  - Démarre l’écoute du serveur (port, host)
*/
// 1️⃣ Ce premier import charge .env avant tout le reste


import 'dotenv/config'
import Fastify from 'fastify'
import jwtPlugin from './plugins/jwt.js'
import { registerRoutes } from './routes/index.js'

// maintenant process.env.* est déjà peuplé
import pool from './db/pgClient.js'

await pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
  )
`)

const app = Fastify({ logger: true })

async function start() {
  try {
    await app.register(jwtPlugin)
    await registerRoutes(app)

    const port = Number(process.env.PORT || 3000)
    await app.listen({ port, host: '0.0.0.0' })
    console.log(`🚀 Server running at http://localhost:${port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
