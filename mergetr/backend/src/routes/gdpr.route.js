// backend/src/routes/gdpr.route.js - Routes GDPR obligatoires
import { GDPRService } from '../services/GDPRService.js';
import pool from '../config/db.js';

export default async function gdprRoutes(app) {
    
    // 🔧 ROUTE DE TEST TEMPORAIRE (sans authentification)
    app.get('/test', async (request, reply) => {
        return {
            message: 'GDPR Routes are working!',
            available_routes: [
                'GET /api/gdpr/export (requires JWT auth)',
                'POST /api/gdpr/anonymize (requires JWT auth)',
                'DELETE /api/gdpr/account (requires JWT auth)',
                'GET /api/gdpr/test (this test route)'
            ],
            gdpr_compliance: 'Articles 15 & 17',
            timestamp: new Date().toISOString()
        };
    });
    
    // Route pour exporter ses données personnelles (GDPR Art. 15)
    app.get('/export', {
        preHandler: [app.authenticate],
        schema: {
            summary: 'Export des données personnelles (GDPR Article 15)',
            description: 'Permet à un utilisateur d\'exporter toutes ses données personnelles',
            response: {
                200: {
                    type: 'object',
                    properties: {
                        export_info: { type: 'object' },
                        personal_data: { type: 'object' },
                        gdpr_rights: { type: 'object' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const userId = request.user.userId || request.user.sub || request.user.id;
            const exportData = await GDPRService.exportUserData(userId);
            
            // Log de l'export pour audit
            app.log.info({
                action: 'gdpr_data_export',
                user_id: userId,
                timestamp: new Date().toISOString()
            }, 'GDPR data export requested');
            
            reply.header('Content-Type', 'application/json');
            reply.header('Content-Disposition', `attachment; filename="gdpr_export_${userId}_${Date.now()}.json"`);
            
            return exportData;
        } catch (error) {
            app.log.error('GDPR export error:', error);
            return reply.code(500).send({ error: 'Export failed' });
        }
    });
    
    // Route pour l'anonymisation (GDPR Art. 17)
    app.post('/anonymize', {
        preHandler: [app.authenticate],
        schema: {
            summary: 'Anonymisation du compte (GDPR Article 17)',
            description: 'Anonymise toutes les données personnelles de l\'utilisateur',
            body: {
                type: 'object',
                required: ['confirmation'],
                properties: {
                    confirmation: { 
                        type: 'string',
                        enum: ['I_UNDERSTAND_THIS_IS_IRREVERSIBLE']
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { confirmation } = request.body;
            const userId = request.user.userId || request.user.sub || request.user.id;
            
            if (confirmation !== 'I_UNDERSTAND_THIS_IS_IRREVERSIBLE') {
                return reply.code(400).send({ 
                    error: 'Invalid confirmation. This action is irreversible.' 
                });
            }
            
            const result = await GDPRService.anonymizeUser(userId);
            
            // Log de l'anonymisation pour audit
            app.log.warn({
                action: 'gdpr_user_anonymization',
                user_id: userId,
                timestamp: new Date().toISOString()
            }, 'User anonymized under GDPR Article 17');
            
            return result;
        } catch (error) {
            app.log.error('GDPR anonymization error:', error);
            return reply.code(500).send({ error: 'Anonymization failed' });
        }
    });
    
    // Route pour la suppression de compte (GDPR Art. 17)
    app.delete('/account', {
        preHandler: [app.authenticate],
        schema: {
            summary: 'Suppression du compte (GDPR Article 17)',
            description: 'Supprime définitivement le compte utilisateur',
            body: {
                type: 'object',
                required: ['confirmation', 'reason'],
                properties: {
                    confirmation: { 
                        type: 'string',
                        enum: ['DELETE_MY_ACCOUNT_PERMANENTLY']
                    },
                    reason: {
                        type: 'string',
                        enum: ['privacy_concerns', 'no_longer_needed', 'other'],
                        description: 'Raison de la suppression'
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { confirmation, reason } = request.body;
            const userId = request.user.userId || request.user.sub || request.user.id;
            
            if (confirmation !== 'DELETE_MY_ACCOUNT_PERMANENTLY') {
                return reply.code(400).send({ 
                    error: 'Invalid confirmation. Account deletion is permanent.' 
                });
            }
            
            const result = await GDPRService.deleteAccount(userId);
            
            // Log de la suppression pour audit
            app.log.warn({
                action: 'gdpr_account_deletion',
                user_id: userId,
                reason: reason,
                timestamp: new Date().toISOString()
            }, 'Account deleted under GDPR Article 17');
            
            return result;
        } catch (error) {
            app.log.error('GDPR account deletion error:', error);
            return reply.code(500).send({ error: 'Account deletion failed' });
        }
    });
    
    // Route pour vérifier le consentement GDPR
    app.get('/consent', {
        preHandler: [app.authenticate],
        schema: {
            summary: 'Vérifier le consentement GDPR',
            description: 'Vérifie le statut du consentement GDPR de l\'utilisateur'
        }
    }, async (request, reply) => {
        try {
            const userId = request.user.userId || request.user.sub || request.user.id;
            const consentInfo = await GDPRService.checkConsent(userId);
            
            return {
                user_id: userId,
                consent_status: consentInfo,
                gdpr_rights: {
                    right_to_access: '/api/gdpr/export',
                    right_to_rectification: 'Contact support or update profile',
                    right_to_erasure: '/api/gdpr/account (DELETE)',
                    right_to_anonymization: '/api/gdpr/anonymize'
                }
            };
        } catch (error) {
            app.log.error('GDPR consent check error:', error);
            return reply.code(500).send({ error: 'Consent check failed' });
        }
    });
    
    // Route pour mettre à jour le consentement
    app.put('/consent', {
        preHandler: [app.authenticate],
        schema: {
            summary: 'Mettre à jour le consentement GDPR',
            body: {
                type: 'object',
                required: ['gdpr_consent', 'privacy_policy_version'],
                properties: {
                    gdpr_consent: { type: 'boolean' },
                    privacy_policy_version: { type: 'string' }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { gdpr_consent, privacy_policy_version } = request.body;
            const userId = request.user.userId || request.user.sub || request.user.id;
            
            await pool.query(`
                UPDATE users 
                SET 
                    gdpr_consent = $1,
                    gdpr_consent_date = NOW(),
                    privacy_policy_version = $2
                WHERE id = $3
            `, [gdpr_consent, privacy_policy_version, userId]);
            
            app.log.info({
                action: 'gdpr_consent_update',
                user_id: userId,
                consent: gdpr_consent,
                policy_version: privacy_policy_version
            }, 'GDPR consent updated');
            
            return { success: true, message: 'Consent updated successfully' };
        } catch (error) {
            app.log.error('GDPR consent update error:', error);
            return reply.code(500).send({ error: 'Consent update failed' });
        }
    });
    
    app.log.info('✅ GDPR routes loaded (Article 15, 17 compliance)');
}
