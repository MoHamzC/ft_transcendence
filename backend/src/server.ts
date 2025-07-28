/*
    server.ts — 🧠 Point d’entrée principal

    C’est le fichier exécuté par ts-node-dev.

  - Initialise Fastify

  - Configure les plugins (plus tard)

  - Charge les routes via registerRoutes(app)

  - Démarre l’écoute du serveur (port, host)
*/

import Fastify from 'fastify';
import dotenv from 'dotenv';
dotenv.config();

import { registerRoutes } from './routes';
import jwtPlugin from './plugins/jwt';

const app = Fastify({ logger: true });

const start = async () =>
{
  try
  {
    await app.register(jwtPlugin);      // TOUJOURS DANS FONCTION ASYNC
    registerRoutes(app);

    const port = Number(process.env.PORT || 3000);
    await app.listen({ port, host: '0.0.0.0' });

    console.log(`🚀 Server running at http://localhost:${port}`);
  }
  catch (err)
  {
    app.log.error(err);
    process.exit(1);
  }
};

start(); // ⬅️ Et on lance la fonction ici