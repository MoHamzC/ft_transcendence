import { FastifyInstance } from 'fastify';
import authRoutes from './auth.route';


/*
routes/index.ts — 📚 Registre central des routes

    - Rassemble toutes les routes en un seul endroit.

    - Regroupe les modules de routes : auth, users, game, matchmaking, etc.

    - Évite les appels app.get(...) dispersés partout

    - Permet un autoload propre et lisible
*/


export async function registerRoutes(app: FastifyInstance) {
  app.register(authRoutes, { prefix: '/api/auth' });
  // Pour ajouter ici :
  // app.register(userRoutes, { prefix: '/api/users' });
  // app.register(matchmakingRoutes, { prefix: '/api/matchmaking' });
}
