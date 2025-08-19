// src/routes/vault.route.js
// Routes d'administration et monitoring pour Vault
// ⚠️ Ces routes doivent être protégées en production !

import { vaultService } from '../services/VaultService.js';

async function vaultRoutes(fastify, options) {
    
    // Health check de Vault
    fastify.get('/health', async (request, reply) => {
        try {
            const isHealthy = await vaultService.healthCheck();
            
            if (isHealthy) {
                return {
                    status: 'healthy',
                    vault: 'connected',
                    timestamp: new Date().toISOString()
                };
            } else {
                return reply.code(503).send({
                    status: 'unhealthy',
                    vault: 'disconnected',
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            return reply.code(500).send({
                status: 'error',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });
    
    // Liste des secrets disponibles (pour le debug en dev seulement)
    fastify.get('/secrets', async (request, reply) => {
        if (process.env.NODE_ENV === 'production') {
            return reply.code(403).send({ error: 'Not available in production' });
        }
        
        try {
            const secrets = await vaultService.listSecrets();
            return {
                secrets: secrets,
                count: secrets.length,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return reply.code(500).send({
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });
    
    // Test de lecture d'un secret spécifique (dev seulement)
    fastify.get('/secret/*', async (request, reply) => {
        if (process.env.NODE_ENV === 'production') {
            return reply.code(403).send({ error: 'Not available in production' });
        }
        
        // Récupérer le chemin complet après /secret/
        const fullPath = request.url.replace('/api/vault/secret/', '');
        
        try {
            const secret = await vaultService.readSecret(`secret/${fullPath}`);
            return {
                path: `secret/${fullPath}`,
                data: secret,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return reply.code(404).send({
                error: `Secret not found: secret/${fullPath}`,
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });
    
    // Initialisation forcée des secrets de dev
    fastify.post('/init-dev-secrets', async (request, reply) => {
        if (process.env.NODE_ENV === 'production') {
            return reply.code(403).send({ error: 'Not available in production' });
        }
        
        try {
            await vaultService.initializeDevSecrets();
            return {
                message: 'Dev secrets initialized successfully',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return reply.code(500).send({
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });
}

export default vaultRoutes;
