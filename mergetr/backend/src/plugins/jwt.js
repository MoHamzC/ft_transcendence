// src/plugins/jwt.js
import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { vaultService } from '../services/VaultService.js';

export default fp(async (app) => {
  console.log('🔐 JWT plugin starting...');

  let secret;

  try {
    // Essayer de récupérer le secret depuis Vault
    if (!vaultService.isInitialized) {
      await vaultService.initialize();
    }

    const jwtData = await vaultService.getJWTSecret();
    secret = jwtData.secret || jwtData; // Utiliser jwtData directement si secret n'existe pas
    console.log('✅ JWT secret loaded from Vault');

  } catch (error) {
    console.log('⚠️ Failed to load JWT secret from Vault, using fallback:', error.message);

    // Fallback vers les variables d'environnement
    secret = process.env.JWT_SECRET;
    if (!secret) {
      app.log.error('❌ JWT_SECRET is missing in environment and Vault unavailable');
      process.exit(1);
    }
  }

  console.log('🔐 JWT secret found, registering fastify-jwt...');

  let jwtOptions = {};
  if (typeof secret === 'string') {
    if (secret.startsWith('-----BEGIN')) {
      jwtOptions = { privateKey: secret, algorithm: 'RS256' };
    } else {
      jwtOptions = { secret, algorithm: 'HS256' };
    }
  } else if (typeof secret === 'object' && secret.privateKey) {
    jwtOptions = { privateKey: secret.privateKey, algorithm: 'RS256' };
    if (secret.publicKey) {
      jwtOptions.publicKey = secret.publicKey;
    }
  } else {
    jwtOptions = { secret, algorithm: 'HS256' };
  }

  app.register(fastifyJwt, jwtOptions);
  console.log('🔐 JWT plugin registered successfully');

  app.decorate('authenticate', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  console.log('🔐 JWT plugin loaded');
});
