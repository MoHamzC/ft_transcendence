import TournamentTempService from '../services/TournamentTempService.js';

export default async function tournamentTempRoutes(fastify, options) {

    // Créer un nouveau tournoi
    fastify.post('/create', async (request, reply) => {
        try {
            const { name, mode } = request.body;

            if (!name || !mode) {
                return reply.code(400).send({
                    success: false,
                    error: 'Name and mode are required'
                });
            }

            if (!['4_players', '8_players'].includes(mode)) {
                return reply.code(400).send({
                    success: false,
                    error: 'Mode must be 4_players or 8_players'
                });
            }

            // Essayer d'obtenir l'utilisateur authentifié (optionnel)
            let createdBy = null;
            try {
                const token = request.cookies.access_token;
                if (token) {
                    const decoded = fastify.jwt.verify(token);
                    createdBy = decoded.id;
                }
            } catch (err) {
                // Pas d'utilisateur authentifié, continuer sans
            }

            const result = await TournamentTempService.createTournament({
                name,
                mode,
                createdBy
            });

            return reply.send(result);

        } catch (error) {
            console.error('Error in create tournament route:', error);
            return reply.code(500).send({
                success: false,
                error: 'Internal server error'
            });
        }
    });

    // Rejoindre un tournoi (avec utilisateur temporaire ou authentifié)
    fastify.post('/:tournamentId/join', async (request, reply) => {
        try {
            const { tournamentId } = request.params;
            const { alias, isTemporary = false } = request.body;

            if (!alias || alias.trim().length === 0) {
                return reply.code(400).send({
                    success: false,
                    error: 'Alias is required'
                });
            }

            if (alias.length > 50) {
                return reply.code(400).send({
                    success: false,
                    error: 'Alias must be 50 characters or less'
                });
            }

            // Essayer d'obtenir l'utilisateur authentifié
            let userId = null;
            let finalIsTemporary = isTemporary;

            if (!isTemporary) {
                try {
                    const token = request.cookies.access_token;
                    if (token) {
                        const decoded = fastify.jwt.verify(token);
                        userId = decoded.id;
                        finalIsTemporary = false;
                    } else {
                        finalIsTemporary = true;
                    }
                } catch (err) {
                    finalIsTemporary = true;
                }
            }

            const result = await TournamentTempService.registerParticipant(tournamentId, {
                alias: alias.trim(),
                userId,
                isTemporary: finalIsTemporary
            });

            return reply.send(result);

        } catch (error) {
            console.error('Error in join tournament route:', error);
            return reply.code(500).send({
                success: false,
                error: 'Internal server error'
            });
        }
    });

    // Obtenir les détails d'un tournoi
    fastify.get('/:tournamentId', async (request, reply) => {
        try {
            const { tournamentId } = request.params;
            const result = await TournamentTempService.getTournamentDetails(tournamentId);
            return reply.send(result);
        } catch (error) {
            console.error('Error in get tournament route:', error);
            return reply.code(500).send({
                success: false,
                error: 'Internal server error'
            });
        }
    });

    // Lister les tournois actifs
    fastify.get('/active', async (request, reply) => {
        try {
            const result = await TournamentTempService.getActiveTournaments();
            return reply.send(result);
        } catch (error) {
            console.error('Error in get active tournaments route:', error);
            return reply.code(500).send({
                success: false,
                error: 'Internal server error'
            });
        }
    });

    // Démarrer un tournoi
    fastify.post('/:tournamentId/start', async (request, reply) => {
        try {
            const { tournamentId } = request.params;

            // Vérifier si l'utilisateur est authentifié (optionnel mais recommandé)
            let canStart = true;
            try {
                const token = request.cookies.access_token;
                if (token) {
                    const decoded = fastify.jwt.verify(token);
                    // L'utilisateur authentifié peut démarrer
                } else {
                    // Permettre aussi aux utilisateurs non authentifiés de démarrer (pour demo)
                    canStart = true;
                }
            } catch (err) {
                canStart = true; // Pour la démo, permettre à tous
            }

            if (!canStart) {
                return reply.code(403).send({
                    success: false,
                    error: 'Not authorized to start tournament'
                });
            }

            const result = await TournamentTempService.startTournament(tournamentId);
            return reply.send(result);

        } catch (error) {
            console.error('Error in start tournament route:', error);
            return reply.code(500).send({
                success: false,
                error: 'Internal server error'
            });
        }
    });

    // Obtenir les matchs d'un tournoi
    fastify.get('/:tournamentId/matches', async (request, reply) => {
        try {
            const { tournamentId } = request.params;
            const result = await TournamentTempService.getTournamentMatches(tournamentId);
            return reply.send(result);
        } catch (error) {
            console.error('Error in get tournament matches route:', error);
            return reply.code(500).send({
                success: false,
                error: 'Internal server error'
            });
        }
    });

    // Nettoyer les utilisateurs temporaires expirés
    fastify.delete('/cleanup/temp-users', async (request, reply) => {
        try {
            const cleanedCount = TournamentTempService.cleanupExpiredTempUsers();
            return reply.send({
                success: true,
                message: `Cleaned up ${cleanedCount} expired temporary users`
            });
        } catch (error) {
            console.error('Error in cleanup route:', error);
            return reply.code(500).send({
                success: false,
                error: 'Internal server error'
            });
        }
    });

    // Test endpoint
    fastify.get('/test', async (request, reply) => {
        return {
            success: true,
            message: 'Tournament Temp API is working!',
            timestamp: new Date().toISOString()
        };
    });
}
