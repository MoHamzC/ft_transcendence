import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt';

// exporte plugin fastify qui configure le jwt (token)
export default fp(async function (app: FastifyInstance)
{
  // recupere le secret depuis le fichier .env
  const secret = process.env.JWT_SECRET;
  // si le secret est absent on arrete le serveur
  if (!secret)
  {
    app.log.error('JWT_SECRET is missing in .env');
    process.exit(1);
  }

  // enregistre le plugin jwt avec le secret
  app.register(fastifyJwt, { secret });

  // ajoute un middleware (ca sert a intercepter les requetes) pour verifier les tokens jwt
  app.decorate("authenticate", async function (request, reply)
  {
    try
    {
      await request.jwtVerify(); // valide le token
    }
    catch (err)
    {
      reply.code(401).send({ error: 'Unauthorized' }); // token invalide
    }
  });
});
