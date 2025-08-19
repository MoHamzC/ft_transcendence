// src/plugins/jwt.js
import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { vaultService } from '../services/VaultService.js';

export default fp(async (app) => {
  let secret;
  
  try {
    // Initialiser Vault si ce n'est pas déjà fait
    if (!vaultService.isInitialized) {
      await vaultService.initialize();
    }
    
    // Récupérer le secret JWT depuis Vault
    secret = await vaultService.getJWTSecret();
    app.log.info('✅ JWT secret loaded from Vault');
    
  } catch (error) {
    app.log.warn('⚠️ Failed to load JWT secret from Vault, using fallback:', error.message);
    
    // Fallback sur les variables d'environnement
    secret = process.env.JWT_SECRET;
    if (!secret) {
      app.log.error('❌ JWT_SECRET is missing in .env and Vault unavailable');
      process.exit(1);
    }
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
