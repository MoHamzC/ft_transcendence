

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
// src/routes/auth.route.js
import { UserService } from './services/UserService.js';


export default async function authRoutes(app) {
  app.get('/status', async () => ({ status: 'Auth module OK' }));

  app.post('/register', async (request, reply) => {
    const { email, password } = request.body;
    if (!email || !password) {
      return reply.code(400).send({ error: 'Email and password are required' });
    }

    const existing = await UserService.findByEmail(email);
    if (existing) {
      return reply.code(409).send({ error: 'User already exists' });
    }

    const user = await UserService.createUser(email, password);
    return reply.code(201).send({ id: user.id, email: user.email });
  });

  app.post('/login', async (request, reply) => {
    const { email, password } = request.body;
    if (!email || !password) {
      return reply.code(400).send({ error: 'Email and password are required' });
    }

    const user = await UserService.findByEmail(email);
    if (!user || !(await UserService.verifyPassword(user, password))) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    const token = app.jwt.sign({ id: user.id, email: user.email });
    return { token };
  });

  app.get('/protected',
    { preHandler: [app.authenticate] },
    async (request) => ({
      message: 'Acces autorise',
      user: request.user,
    })
  );

  app.get('/me',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { id } = request.user;
      const user = await UserService.findById(id);
      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }
      return { id: user.id, email: user.email };
    }
  );

  app.post('/logout',
    { preHandler: [app.authenticate] },
    async (request, reply) =>
    {
      const { id } = request.user;

      await AuthService.logout(id);

      return reply.code(200).send({ message: 'Logged out successfully' });
    }
  );
}

