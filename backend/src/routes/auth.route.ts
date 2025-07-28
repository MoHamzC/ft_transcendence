import { FastifyInstance } from 'fastify';
import { UserService } from '../services/UserService';


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

export default async function authRoutes(app: FastifyInstance)
{
  // Ping
  app.get('/status', async () =>
  {
    return { status: 'Auth module OK' };
  });

  // Enregistrement
  app.post('/register', async (request, reply) =>
  {
    const { email, password } = request.body as { email: string, password: string };

    if (!email || !password)
    {
      return reply.code(400).send({ error: 'Email and password are required' });
    }

    const existing = UserService.findByEmail(email);
    if (existing)
    {
      return reply.code(409).send({ error: 'User already exists' });
    }

    const user = UserService.createUser(email, password);
    return reply.code(201).send({ id: user.id, email: user.email });
  });

  // Connexion
  app.post('/login', async (request, reply) =>
  {
    const { email, password } = request.body as { email: string, password: string };

    if (!email || !password)
    {
      return reply.code(400).send({ error: 'Email and password are required' });
    }

    const user = UserService.findByEmail(email);
    if (!user || !UserService.verifyPassword(user, password))
    {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    const token = app.jwt.sign({ id: user.id, email: user.email });
    return { token };
  });
}

