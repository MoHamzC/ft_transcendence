import { FastifyInstance } from 'fastify';

/*
routes/auth.route.ts — 🔐 Groupe de routes REST

    Chaque fichier dans routes/ gère un domaine métier.

    auth.route.ts : tout ce qui concerne /login, /register, /logout, etc.

    Découplé du reste du backend

    Peut facilement être testé ou mocké indépendamment

🧠 À noter : on pourras créer d'autres fichiers :

    users.route.ts

    matchmaking.route.ts

    game.route.ts

    etc.
*/


export default async function authRoutes(app: FastifyInstance) {
  app.get('/status', async () => {
    return { status: 'Auth module OK' };
  });

  // Future: app.post('/login', ...)
  // Future: app.post('/register', ...)
}
