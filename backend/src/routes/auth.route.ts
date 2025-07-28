

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

// importe les types fastify
import { FastifyInstance } from 'fastify'

// importe les fonctions metier pour les users
import { UserService } from '../services/UserService'

// exporte une fonction qui enregistre toutes les routes auth
export default async function authRoutes(app: FastifyInstance)
{
  // route de test pour verifier que le module fonctionne
  app.get('/status', async () =>
  {
    return { status: 'Auth module OK' }
  })

  // creation dun nouvel utilisateur
  app.post('/register', async (request, reply) =>
  {
    // extrait email et password depuis le corps json
    const { email, password } = request.body as { email: string, password: string }

    // si email ou password est manquant
    if (!email || !password)
    {
      return reply.code(400).send({ error: 'Email and password are required' })
    }

    // verifie si un user existe deja avec cet email
    const existing = UserService.findByEmail(email)
    if (existing)
    {
      return reply.code(409).send({ error: 'User already exists' })
    }

    // cree un nouvel utilisateur et retourne ses infos
    const user = UserService.createUser(email, password)
    return reply.code(201).send({ id: user.id, email: user.email })
  })

  // connexion dun utilisateur existant
  app.post('/login', async (request, reply) =>
  {
    // extrait email et password depuis le corps json
    const { email, password } = request.body as { email: string, password: string }

    // si champs manquants
    if (!email || !password)
    {
      return reply.code(400).send({ error: 'Email and password are required' })
    }

    // cherche le user en base
    const user = UserService.findByEmail(email)

    // si user non trouvé ou mauvais mot de passe
    if (!user || !UserService.verifyPassword(user, password))
    {
      return reply.code(401).send({ error: 'Invalid credentials' })
    }

    // genere un token JWT
    const token = app.jwt.sign({ id: user.id, email: user.email })
    return { token }
  })

  // route protegee par JWT
  app.get('/protected',
    {
      preHandler: [app.authenticate] // middleware auth jwt obligatoire
    },
    async (request, reply) =>
    {
      // si on arrive ici le token est valide
      return {
        message: 'Acces autorise',
        user: request.user // infos decodees du token
      }
    }
  )
}

