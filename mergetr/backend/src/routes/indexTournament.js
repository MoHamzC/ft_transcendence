// src/routes/tournaments/index.js

/* Routes pour la gestion des tournois LOCAL
    - CRUD des tournois
    - Inscription/désinscription (avec ou sans compte utilisateur)
    - Gestion des matchs
    - Consultation des résultats
    - VERSION SIMPLIFIÉE POUR TOURNOI LOCAL (SANS WEBSOCKET/NOTIFICATIONS)
*/

import { TournamentService } from '../services/TournamentService.js';

const tournamentRoutes = async (fastify, options) => {
    
    // Créer un nouveau tournoi
    fastify.post('/tournaments', {
        schema: {
            summary: 'Créer un nouveau tournoi',
            body: {
                type: 'object',
                required: ['name', 'mode'],
                properties: {
                    name: { type: 'string', minLength: 3, maxLength: 255 },
                    description: { type: 'string', maxLength: 1000 },
                    mode: { type: 'string', enum: ['4_players', '8_players'] }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { name, description, mode } = request.body;
            
            // Déduire max_players du mode
            const maxPlayers = mode === '4_players' ? 4 : 8;
            
            const tournament = await TournamentService.createTournament(
                name, 
                description, 
                mode,
                maxPlayers, 
                request.user?.id
            );
            
            reply.code(201).send({ 
                success: true,
                tournament
            });
        } catch (error) {
            reply.code(500).send({ error: error.message });
        }
    });

    // Lister les tournois
    fastify.get('/tournaments', {
        schema: {
            summary: 'Lister les tournois',
            querystring: {
                type: 'object',
                properties: {
                    status: { type: 'string', enum: ['registration', 'in_progress', 'finished', 'cancelled'] }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { status } = request.query;
            const tournaments = await TournamentService.listTournaments(status);
            reply.send({ tournaments });
        } catch (error) {
            reply.code(500).send({ error: error.message });
        }
    });

    // Récupérer les détails d'un tournoi
    fastify.get('/tournaments/:id', {
        schema: {
            summary: 'Détails d\'un tournoi',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const details = await TournamentService.getTournamentDetails(id);
            reply.send(details);
        } catch (error) {
            reply.code(404).send({ error: error.message });
        }
    });

    // Vérifier si on peut rejoindre un tournoi avec un alias donné
    fastify.post('/tournaments/:id/check-alias', {
        schema: {
            summary: 'Vérifier la disponibilité d\'un alias',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' }
                }
            },
            body: {
                type: 'object',
                required: ['alias'],
                properties: {
                    alias: { type: 'string', minLength: 2, maxLength: 50 }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const { alias } = request.body;
            
            const result = await TournamentService.canJoinTournament(id, alias);
            reply.send(result);
        } catch (error) {
            reply.code(500).send({ error: error.message });
        }
    });

    // S'inscrire à un tournoi (avec ou sans compte utilisateur)
    fastify.post('/tournaments/:id/register', {
        schema: {
            summary: 'S\'inscrire à un tournoi',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' }
                }
            },
            body: {
                type: 'object',
                required: ['alias'],
                properties: {
                    alias: { type: 'string', minLength: 2, maxLength: 50 }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const { alias } = request.body;
            
            // L'utilisateur peut être connecté ou non
            const userId = request.user?.id || null;
            
            const participant = await TournamentService.registerPlayer(id, userId, alias);
            
            reply.code(201).send({ 
                success: true,
                participant,
                message: `${alias} s'est inscrit au tournoi avec succès`
            });
        } catch (error) {
            reply.code(400).send({ error: error.message });
        }
    });

    // Démarrer un tournoi
    fastify.post('/tournaments/:id/start', {
        schema: {
            summary: 'Démarrer un tournoi',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const result = await TournamentService.startTournament(id);
            
            // Récupérer le premier match pour l'annonce
            const nextMatch = await TournamentService.getNextMatch(id);
            
            reply.send({
                ...result,
                nextMatch
            });
        } catch (error) {
            reply.code(400).send({ error: error.message });
        }
    });

    // Récupérer le prochain match
    fastify.get('/tournaments/:id/next-match', {
        schema: {
            summary: 'Prochain match à jouer',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const match = await TournamentService.getNextMatch(id);
            
            if (!match) {
                return reply.send({ 
                    match: null, 
                    message: 'Aucun match en attente' 
                });
            }
            
            reply.send({ 
                match,
                announcement: `Prochain match : ${match.player1_alias} vs ${match.player2_alias}`
            });
        } catch (error) {
            reply.code(500).send({ error: error.message });
        }
    });

    // Enregistrer le résultat d'un match (simple)
    fastify.post('/matches/:matchId/result', {
        schema: {
            summary: 'Enregistrer le résultat d\'un match',
            params: {
                type: 'object',
                properties: {
                    matchId: { type: 'string', format: 'uuid' }
                }
            },
            body: {
                type: 'object',
                required: ['winnerId', 'player1Score', 'player2Score'],
                properties: {
                    winnerId: { type: 'string', format: 'uuid' },
                    player1Score: { type: 'integer', minimum: 0 },
                    player2Score: { type: 'integer', minimum: 0 }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { matchId } = request.params;
            const { winnerId, player1Score, player2Score } = request.body;
            
            // Validation simple : pas de match nul
            if (player1Score === player2Score) {
                return reply.code(400).send({ 
                    error: 'Match nul non autorisé dans un tournoi à élimination' 
                });
            }

            const result = await TournamentService.recordMatchResult(
                matchId, 
                winnerId, 
                player1Score, 
                player2Score
            );
            
            reply.send({
                ...result,
                message: 'Résultat enregistré avec succès'
            });
        } catch (error) {
            reply.code(400).send({ error: error.message });
        }
    });

};

export default tournamentRoutes;
