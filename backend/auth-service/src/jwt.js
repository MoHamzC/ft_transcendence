// src/plugins/jwt.js

import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';

export default fp(async function (app)
{
    app.register(fastifyJwt,
    {
        secret: process.env.JWT_SECRET || 'supersecret'
    });

    app.decorate('authenticate', async function (request, reply)
    {
        try
        {
            await request.jwtVerify();
        }
        catch (err)
        {
            reply.send(err);
        }
    });
});
