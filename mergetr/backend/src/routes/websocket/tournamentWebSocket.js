// src/routes/websocket/tournamentWebSocket.js

/* Routes WebSocket pour les notifications de tournoi en temps réel
    - Connexions WebSocket pour les mises à jour live
    - Intégration avec le service de notifications
    - Gestion des connexions et déconnexions
*/

import { tournamentNotificationService } from '../../services/TournamentNotificationService.js';
import { randomUUID } from 'crypto';

export default async function tournamentWebSocketRoutes(fastify, options) {
    
    // Route WebSocket pour les notifications de tournoi
    fastify.register(async function (fastify) {
        
        // WebSocket pour un tournoi spécifique
        fastify.get('/tournaments/:tournamentId/ws', { websocket: true }, (connection, request) => {
            const { tournamentId } = request.params;
            const connectionId = randomUUID();
            
            console.log(`🔌 Nouvelle connexion WebSocket pour tournoi ${tournamentId}`);

            try {
                // Abonner la connexion au tournoi
                tournamentNotificationService.subscribe(tournamentId, connectionId, connection.socket);

                // Gérer les messages entrants du client
                connection.socket.on('message', (message) => {
                    try {
                        const data = JSON.parse(message.toString());
                        handleClientMessage(tournamentId, connectionId, data);
                    } catch (error) {
                        console.error('Erreur parsing message WebSocket:', error);
                        connection.socket.send(JSON.stringify({
                            type: 'error',
                            message: 'Format de message invalide'
                        }));
                    }
                });

                // Gérer les erreurs
                connection.socket.on('error', (error) => {
                    console.error(`❌ Erreur WebSocket ${connectionId}:`, error);
                    tournamentNotificationService.unsubscribe(tournamentId, connectionId);
                });

                // Gérer la fermeture de connexion
                connection.socket.on('close', () => {
                    console.log(`🔌 Connexion WebSocket fermée ${connectionId}`);
                    tournamentNotificationService.unsubscribe(tournamentId, connectionId);
                });

                // Envoyer un message de bienvenue
                connection.socket.send(JSON.stringify({
                    type: 'welcome',
                    message: `Connecté aux notifications du tournoi ${tournamentId}`,
                    connectionId,
                    tournamentId
                }));

            } catch (error) {
                console.error('Erreur lors de l\'initialisation WebSocket:', error);
                connection.socket.close();
            }
        });

        // WebSocket général pour les notifications globales
        fastify.get('/tournaments/ws', { websocket: true }, (connection, request) => {
            const connectionId = randomUUID();
            
            console.log(`🔌 Nouvelle connexion WebSocket globale ${connectionId}`);

            // Envoyer les stats des tournois actifs
            connection.socket.send(JSON.stringify({
                type: 'welcome',
                message: 'Connecté aux notifications globales des tournois',
                connectionId,
                stats: tournamentNotificationService.getStats()
            }));

            // Écouter les notifications globales
            const globalNotificationHandler = (data) => {
                connection.socket.send(JSON.stringify({
                    type: 'global_notification',
                    ...data
                }));
            };

            tournamentNotificationService.on('notification_sent', globalNotificationHandler);

            // Nettoyer lors de la fermeture
            connection.socket.on('close', () => {
                console.log(`🔌 Connexion WebSocket globale fermée ${connectionId}`);
                tournamentNotificationService.removeListener('notification_sent', globalNotificationHandler);
            });
        });
    });

    // Route HTTP pour envoyer des notifications manuelles (pour les tests)
    fastify.post('/tournaments/:tournamentId/notify', {
        schema: {
            summary: 'Envoyer une notification manuelle (test)',
            params: {
                type: 'object',
                properties: {
                    tournamentId: { type: 'string', format: 'uuid' }
                }
            },
            body: {
                type: 'object',
                required: ['type', 'message'],
                properties: {
                    type: { type: 'string' },
                    message: { type: 'string' },
                    data: { type: 'object' },
                    priority: { type: 'string', enum: ['low', 'medium', 'high'], default: 'medium' }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { tournamentId } = request.params;
            const notification = request.body;

            tournamentNotificationService.broadcast(tournamentId, notification);

            reply.send({
                success: true,
                message: 'Notification envoyée',
                stats: tournamentNotificationService.getStats()
            });
        } catch (error) {
            reply.code(500).send({ error: error.message });
        }
    });

    // Route pour obtenir les statistiques des connexions WebSocket
    fastify.get('/tournaments/ws-stats', {
        schema: {
            summary: 'Statistiques des connexions WebSocket'
        }
    }, async (request, reply) => {
        const stats = tournamentNotificationService.getStats();
        reply.send(stats);
    });
}

// Gérer les messages entrants des clients WebSocket
function handleClientMessage(tournamentId, connectionId, data) {
    console.log(`📨 Message reçu de ${connectionId} pour tournoi ${tournamentId}:`, data);

    switch (data.type) {
        case 'ping':
            // Répondre au ping
            tournamentNotificationService.sendToConnection(connectionId, {
                type: 'pong',
                timestamp: new Date().toISOString()
            });
            break;

        case 'request_status':
            // Envoyer le statut du tournoi
            tournamentNotificationService.sendToConnection(connectionId, {
                type: 'status_response',
                data: {
                    connectionId,
                    tournamentId,
                    connected: true,
                    stats: tournamentNotificationService.getStats()
                }
            });
            break;

        case 'player_ready':
            // Notifier que le joueur est prêt (pour un match)
            tournamentNotificationService.broadcast(tournamentId, {
                type: 'player_ready_notification',
                message: `Un joueur est prêt pour le match`,
                data: {
                    playerId: data.playerId,
                    alias: data.alias
                },
                priority: 'medium'
            });
            break;

        default:
            console.log(`❓ Type de message inconnu: ${data.type}`);
            tournamentNotificationService.sendToConnection(connectionId, {
                type: 'error',
                message: `Type de message non reconnu: ${data.type}`
            });
    }
}
