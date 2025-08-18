// src/plugins/jwt.js
import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';

export default fp(async (app) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    app.log.error('JWT_SECRET is missing in .env');
    process.exit(1);
  }

  app.register(fastifyJwt, { secret });

  app.decorate('authenticate', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      reply.code(401).send({ error: 'Unauthorized' });
    }
  });
});
