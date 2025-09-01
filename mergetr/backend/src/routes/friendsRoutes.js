// backend/src/routes/user.route.js
//
// Routes "utilisateur" protégées par JWT
// - Validation stricte des entrées (JSON Schema)
// - Codes HTTP explicites
// - Réponses stables pour faciliter les tests REST Client
//
// Préfixe attendu à l’enregistrement : { prefix: '/api/user' }

import { StatsService }       from '../services/StatsService.js';
import { LeaderboardService } from '../services/LeaderboardService.js';
import { FriendService }      from '../services/FriendService.js';

// Regex UUID (v4/v5) si ajv-formats n’est pas branché.
const UUID_PATTERN =
    '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$';

const schemas =
{
    leaderboardQuery:
    {
        type: 'object',
        additionalProperties: false,
        properties:
        {
            limit:  { type: 'integer', minimum: 1, maximum: 100, default: 10 },
            offset: { type: 'integer', minimum: 0,                default: 0  }
        }
    },
    friendsCreateBody:
    {
        type: 'object',
        required: ['username'],
        additionalProperties: false,
        properties:
        {
            username:
            {
                type: 'string',
                minLength: 1,
                maxLength: 30,
                description: 'Nom d\'utilisateur du destinataire'
            }
        }
    },
    friendsAcceptBody:
    {
        type: 'object',
        required: ['requesterId'],
        additionalProperties: false,
        properties:
        {
            requesterId:
            {
                type: 'string',
                pattern: UUID_PATTERN,
                description: 'UUID de l’émetteur de la demande'
            }
        }
    },

	friendsRemoveBody:
    {
        type: 'object',
        required: ['friendId'],
        additionalProperties: false,
        properties:
        {
            friendId:
            {
                type: 'string',
                pattern: UUID_PATTERN,
                description: 'UUID de l\'ami à supprimer'
            }
        }
    }
};

export default async function friendsRoutes(app /* : FastifyInstance */)
{
    //
    // 🔐 Protéger tout le groupe de routes
    // NB: onRequest ou preHandler conviennent. On garde preHandler pour
    //     rester homogène avec le reste de votre code.
    //
    app.addHook('preHandler', app.authenticate);

    //
    // GET /api/user/statistics
    //
    app.get('/statistics',
    {
        schema:
        {
            summary: 'Statistiques personnelles',
            response:
            {
                200:
                {
                    type: 'object',
                    properties:
                    {
                        stats: { type: 'object' }
                    }
                }
            }
        }
    },
    async (request, reply) =>
    {
        const uid   = request.user.id;
        const stats = await StatsService.getStats(uid);

        // Pas de cache sur une ressource personnelle
        reply.header('Cache-Control', 'no-store');

        return { stats };
    });

    //
    // GET /api/user/leaderboard?limit&offset
    //
    app.get('/leaderboard',
    {
        schema:
        {
            summary: 'Classement global',
            querystring: schemas.leaderboardQuery,
            response:
            {
                200:
                {
                    type: 'object',
                    properties:
                    {
                        leaderboard: { type: 'array', items: { type: 'object', additionalProperties: true } }
                    }
                }
            }
        }
    },
    async (request, reply) =>
    {
        // Optionnel : si votre service n’accepte pas (limit, offset),
        // laissez-le ignorer ces paramètres.
        const { limit = 10, offset = 0 } = request.query ?? {};
        const board = await LeaderboardService.getBoard({ limit, offset });

        // Cache court possible si besoin, ici on désactive pour la simplicité de test
        reply.header('Cache-Control', 'no-store');

        return { leaderboard: board };
    });

    //
    // GET /api/user/friends
    //
    app.get('/friends',
    {
        schema:
        {
            summary: 'Liste des amis',
            response:
            {
                200:
                {
                    type: 'object',
                    properties:
                    {
                        // IMPORTANT: without additionalProperties, fast-json-stringify strips fields -> [{}]
                        friends: { type: 'array', items: { type: 'object', additionalProperties: true } }
                    }
                }
            }
        }
    },
    async (request, reply) =>
    {
        const uid     = request.user.id;
        const friends = await FriendService.listFriends(uid);
        return { friends };
    });

    // GET /api/user/friends/status - Liste des amis avec statut en ligne
    //
    app.get('/friends/status',
    {
        schema:
        {
            summary: 'Liste des amis avec statut en ligne',
            response:
            {
                200:
                {
                    type: 'object',
                    properties:
                    {
                        friends: { type: 'array', items: { type: 'object', additionalProperties: true } }
                    }
                }
            }
        }
    },
    async (request, reply) =>
    {
        const uid = request.user.id;
        const friends = await FriendService.listFriendsWithOnlineStatus(uid);
        return { friends };
    });

    // POST /api/user/heartbeat - Signaler que l'utilisateur est en ligne
    //
    app.post('/heartbeat',
    {
        schema:
        {
            summary: 'Signaler que l\'utilisateur est en ligne',
            response:
            {
                200:
                {
                    type: 'object',
                    properties:
                    {
                        status: { type: 'string' },
                        timestamp: { type: 'string' }
                    }
                }
            }
        }
    },
    async (request, reply) =>
    {
        const uid = request.user.id;
        const result = await FriendService.updateHeartbeat(uid);
        return { 
            status: 'online', 
            timestamp: result.last_seen 
        };
    });

    // POST /api/user/logout-status - Marquer l'utilisateur comme offline
    //
    app.post('/logout-status',
    {
        schema:
        {
            summary: 'Marquer l\'utilisateur comme offline',
            response:
            {
                200:
                {
                    type: 'object',
                    properties:
                    {
                        status: { type: 'string' }
                    }
                }
            }
        }
    },
    async (request, reply) =>
    {
        const uid = request.user.id;
        await FriendService.setUserOffline(uid);
        return { status: 'offline' };
    });

    // POST /api/user/cleanup-inactive - Nettoyer les utilisateurs inactifs
    //
    app.post('/cleanup-inactive',
    {
        schema:
        {
            summary: 'Nettoyer les utilisateurs inactifs',
            response:
            {
                200:
                {
                    type: 'object',
                    properties:
                    {
                        message: { type: 'string' },
                        updated_users: { type: 'number' }
                    }
                }
            }
        }
    },
    async (request, reply) =>
    {
        const cleanedUsers = await FriendService.cleanupInactiveUsers();
        return { 
            message: 'Cleanup completed',
            updated_users: cleanedUsers.length 
        };
    });

    //
    // POST /api/user/friends
    // Body: { username }
    //
    app.post('/friends',
    {
        schema:
        {
            summary: 'Envoyer une demande d ami',
            body: schemas.friendsCreateBody,
            response:
            {
                201:
                {
                    type: 'object',
                    properties:
                    {
                        message: { type: 'string' }
                    }
                },
                409:
                {
                    type: 'object',
                    properties:
                    {
                        message: { type: 'string' }
                    }
                }
            }
        }
    },
    async (request, reply) =>
    {
        const { username } = request.body;
        try
        {
            const result = await FriendService.sendRequestByUsername(request.user.id, username);
            reply.code(201).send(result);
        }
        catch (err)
        {
            if (err.message.includes('already friends') ||
                err.message.includes('already exists') ||
                err.message.includes('previously rejected'))
            {
                reply.code(409).send({ message: err.message });
            }
            else if (err.message.includes('not found') ||
                     err.message.includes('yourself'))
            {
                reply.code(400).send({ message: err.message });
            }
            else
            {
                throw err;
            }
        }
    });    //
    // GET /api/user/friends/pending - Liste des demandes reçues
    //
    app.get('/friends/pending',
    {
        schema:
        {
            summary: 'Liste des demandes d\'amis reçues en attente',
            response:
            {
                200:
                {
                    type: 'object',
                    properties:
                    {
                        pending: { type: 'array', items: { type: 'object', additionalProperties: true } }
                    }
                }
            }
        }
    },
    async (request, reply) =>
    {
        const uid = request.user.id;
        console.log("Voici les demandes d'amis en attente pour l'utilisateur:", uid);
		console.log("Voici id", request.user);
        const pending = await FriendService.listPendingRequests(uid);
        return { pending };
    });

    //
    // POST /api/user/friends/reject - Rejeter une demande d'ami
    // Body: { requesterId }
    //
    app.post('/friends/reject',
    {
        schema:
        {
            summary: 'Rejeter une demande d\'ami',
            body: schemas.friendsAcceptBody, // Même schéma que accept
            response:
            {
                200:
                {
                    type: 'object',
                    properties:
                    {
                        message: { type: 'string' }
                    }
                },
                404:
                {
                    type: 'object',
                    properties:
                    {
                        message: { type: 'string' }
                    }
                }
            }
        }
    },
    async (request, reply) =>
    {
        const { requesterId } = request.body;
        try
        {
            await FriendService.rejectRequest(request.user.id, requesterId);
            reply.code(200).send({ message: 'Friend request rejected' });
        }
        catch (err)
        {
            if (err.message.includes('not found'))
            {
                reply.code(404).send({ message: err.message });
            }
            else
            {
                throw err;
            }
        }
    });

    //
    // POST /api/user/friends/accept
    // Body: { requesterId }
    //
    app.post('/friends/accept',
    {
        schema:
        {
            summary: 'Accepter une demande d’ami',
            body: schemas.friendsAcceptBody,
            response:
            {
                200:
                {
                    type: 'object',
                    properties:
                    {
                        message: { type: 'string' }
                    }
                },
                404:
                {
                    type: 'object',
                    properties:
                    {
                        message: { type: 'string' }
                    }
                }
            }
        }
    },
    async (request, reply) =>
    {
        const { requesterId } = request.body;
        try
        {
            const result = await FriendService.acceptRequest(request.user.id, requesterId);
            reply.code(200).send(result);
        }
        catch (err)
        {
            if (err.message.includes('not found'))
            {
                reply.code(404).send({ message: err.message });
            }
            else
            {
                throw err;
            }
        }
    });

    //
    // GET /api/user/settings
    //
    app.get('/settings',
    {
        schema:
        {
            summary: 'Récupérer les préférences utilisateur',
            response:
            {
                200:
                {
                    type: 'object',
                    properties:
                    {
                        settings: { type: 'object' }
                    }
                }
            }
        }
    },
    async (request, reply) =>
    {
        const uid      = request.user.id;
        const settings = await SettingsService.getSettings(uid);
        return { settings };
    });

    //
    // POST /api/user/logout
    //
    app.post('/logout',
    {
        schema:
        {
            summary: 'Déconnexion',
            response:
            {
                200:
                {
                    type: 'object',
                    properties:
                    {
                        success: { type: 'boolean' }
                    }
                }
            }
        }
    },
    async (request /*, reply */) =>
    {
        return { success: true };
    });

    //
	// POST /api/user/friends/:friendId - Supprimer un ami
	//
	app.post('/friends/remove',
	{
		schema: {
			summary: 'Supprimer un ami',
			body: schemas.friendsRemoveBody,
			response: {
				200: {
					type: 'object',
					properties: {
						message: { type: 'string' }
					}
				},
				404: {
					type: 'object',
					properties: {
						message: { type: 'string' }
					}
				}
			}
		}
	},
	async (request, reply) => {
		const { friendId } = request.body;
		try {
			const result = await FriendService.removeFriend(request.user.id, friendId);
			reply.code(200).send(result);
		} catch (err) {
			if (err.message.includes('not found')) {
				reply.code(404).send({ message: err.message });
			} else {
				throw err;
			}
		}
	});
	}
