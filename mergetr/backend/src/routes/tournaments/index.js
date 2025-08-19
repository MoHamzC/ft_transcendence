// src/routes/tournaments/index.js

/* Routes pour la gestion des tournois
    - CRUD des tournois
    - Inscription/désinscription
    - Gestion des matchs
    - Consultation des résultats
*/

import { TournamentService } from '../../services/TournamentService.js';

const tournamentRoutes = async (fastify, options) => {
    
    // Créer un nouveau tournoi
    fastify.post('/tournaments', async (request, reply) => {
        try {
            const { name, description, maxPlayers, type } = request.body;
            
            if (!name) {
                return reply.code(400).send({ error: 'Le nom du tournoi est obligatoire' });
            }

            const tournament = await TournamentService.createTournament(
                name, 
                description, 
                maxPlayers, 
                type, 
                request.user?.id
            );
            
            reply.code(201).send({ tournament });
        } catch (error) {
            reply.code(500).send({ error: error.message });
        }
    });

    // Lister les tournois
    fastify.get('/tournaments', async (request, reply) => {
        try {
            const { status } = request.query;
            const tournaments = await TournamentService.listTournaments(status);
            reply.send({ tournaments });
        } catch (error) {
            reply.code(500).send({ error: error.message });
        }
    });

    // Récupérer les détails d'un tournoi
    fastify.get('/tournaments/:id', async (request, reply) => {
        try {
            const { id } = request.params;
            const details = await TournamentService.getTournamentDetails(id);
            reply.send(details);
        } catch (error) {
            reply.code(404).send({ error: error.message });
        }
    });

    // S'inscrire à un tournoi
    fastify.post('/tournaments/:id/register', async (request, reply) => {
        try {
            const { id } = request.params;
            const { alias } = request.body;
            
            if (!alias) {
                return reply.code(400).send({ error: 'Un alias est obligatoire' });
            }

            const participant = await TournamentService.registerPlayer(
                id, 
                request.user?.id, 
                alias
            );
            
            reply.code(201).send({ participant });
        } catch (error) {
            reply.code(400).send({ error: error.message });
        }
    });

    // Démarrer un tournoi
    fastify.post('/tournaments/:id/start', async (request, reply) => {
        try {
            const { id } = request.params;
            const result = await TournamentService.startTournament(id);
            reply.send(result);
        } catch (error) {
            reply.code(400).send({ error: error.message });
        }
    });

    // Récupérer le prochain match
    fastify.get('/tournaments/:id/next-match', async (request, reply) => {
        try {
            const { id } = request.params;
            const match = await TournamentService.getNextMatch(id);
            reply.send({ match });
        } catch (error) {
            reply.code(500).send({ error: error.message });
        }
    });

    // Enregistrer le résultat d'un match
    fastify.post('/matches/:matchId/result', async (request, reply) => {
        try {
            const { matchId } = request.params;
            const { winnerId, player1Score, player2Score } = request.body;
            
            if (!winnerId || player1Score === undefined || player2Score === undefined) {
                return reply.code(400).send({ 
                    error: 'winnerId, player1Score et player2Score sont obligatoires' 
                });
            }

            const result = await TournamentService.recordMatchResult(
                matchId, 
                winnerId, 
                player1Score, 
                player2Score
            );
            
            reply.send(result);
        } catch (error) {
            reply.code(400).send({ error: error.message });
        }
    });
};

export default tournamentRoutes;
