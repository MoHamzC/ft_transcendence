import Fastify from 'fastify';
import dotenv from 'dotenv';

/*
    server.ts — 🧠 Point d’entrée principal

    C’est le fichier exécuté par ts-node-dev.

  - Initialise Fastify

  - Configure les plugins (plus tard)

  - Charge les routes via registerRoutes(app)

  - Démarre l’écoute du serveur (port, host)
*/

dotenv.config();

import { registerRoutes } from './routes';

const app = Fastify({ logger: true });

// Routes
registerRoutes(app);

const start = async () => {
  try {
    const port = Number(process.env.PORT || 3000);
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Server running at http://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
