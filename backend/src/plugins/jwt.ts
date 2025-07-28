import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt';

export default fp(async function (app: FastifyInstance)
{
  const secret = process.env.JWT_SECRET;
  if (!secret)
  {
    app.log.error('JWT_SECRET is missing in .env');
    process.exit(1);
  }

  app.register(fastifyJwt, { secret });

  app.decorate("authenticate", async function (request, reply)
  {
    try
    {
      await request.jwtVerify();
    }
    catch (err)
    {
      reply.code(401).send({ error: 'Unauthorized' });
    }
  });
});
