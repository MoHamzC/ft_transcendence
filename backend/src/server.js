/*
    server.ts — 🧠 Point d’entrée principal

    C’est le fichier exécuté par ts-node-dev.

  - Initialise Fastify

  - Configure les plugins (plus tard)

  - Charge les routes via registerRoutes(app)

  - Démarre l’écoute du serveur (port, host)
*/
// src/server.js
import Fastify from 'fastify';
import dotenv from 'dotenv';
dotenv.config();

import jwtPlugin from './plugins/jwt.js';
import { registerRoutes } from './routes/index.js';

const app = Fastify({ logger: true });

async function start() {
  try {
    await app.register(jwtPlugin);
    await registerRoutes(app);

    const port = Number(process.env.PORT || 3000);
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Server running at http://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
