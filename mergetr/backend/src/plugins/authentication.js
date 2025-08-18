// src/plugins/authentication.js
// Plugin pour l'authentification (JWT + Cookies)
import fastifyJwt from '@fastify/jwt'
import fastifyCookie from '@fastify/cookie'

/**
 * Plugin Fastify pour l'authentification
 * @param {Object} fastify - Instance Fastify
 */
export async function registerAuthentication(fastify) {
    // JWT
    await fastify.register(fastifyJwt, {
        secret: process.env.SUPER_SECRET_CODE
    })

    // Cookies
    await fastify.register(fastifyCookie, {
        secret: process.env.SUPER_SECRET_CODE
    })

    // Hook pour attacher JWT aux requêtes
    fastify.addHook('preHandler', async (request, reply) => {
        request.jwt = fastify.jwt
    })

    // Décorateur pour l'authentification
    fastify.decorate('authenticate', async (request, reply) => {
        try {
            await request.jwtVerify()
        } catch (err) {
            reply.send(err)
        }
    })

    fastify.log.info('✅ Authentication configured')
}
