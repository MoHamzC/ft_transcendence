import { requireAuth } from '../middleware/auth.js';

/**
 * Routes pour la gestion des données des joueurs
 * @param {Object} fastify - Instance Fastify
 */
export default async function gameRoutes(fastify) {
  // Schémas de validation
  const getPlayerSchema = {
    response: {
      200: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          pong_color: { type: 'string' },
          pong_skin_type: { type: 'string' },
          avatar_url: { type: ['string', 'null'] }
        }
      },
      404: {
        type: 'object',
        properties: {
          error: { type: 'string' }
        }
      }
    }
  };

  const getPlayerByIdSchema = {
    params: {
      type: 'object',
      properties: {
        playerId: { type: 'string' }
      },
      required: ['playerId']
    },
    response: {
      200: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          pong_color: { type: 'string' },
          pong_skin_type: { type: 'string' },
          avatar_url: { type: ['string', 'null'] }
        }
      },
      404: {
        type: 'object',
        properties: {
          error: { type: 'string' }
        }
      }
    }
  };

  // Récupérer les données du joueur connecté
  fastify.get('/me', {
    schema: getPlayerSchema,
    preValidation: [requireAuth]
  }, async (request, reply) => {
    try {
      const userId = request.user.id;

      const user = await fastify.db.query(
        'SELECT id, username, pong_color, pong_skin_type, avatar_url FROM users WHERE id = ?',
        [userId]
      );

      if (user.length === 0) {
        return reply.status(404).send({ error: 'Utilisateur non trouvé' });
      }

      return {
        id: user[0].id,
        name: user[0].username,
        pong_color: user[0].pong_color || '#0000FF',
        pong_skin_type: user[0].pong_skin_type || 'default',
        avatar_url: user[0].avatar_url
      };
    } catch (error) {
      fastify.log.error('Erreur récupération joueur:', error);
      return reply.status(500).send({ error: 'Erreur serveur' });
    }
  });

  // Récupérer les données d'un autre joueur (pour mode 2 joueurs)
  fastify.get('/:playerId', {
    schema: getPlayerByIdSchema,
    preValidation: [requireAuth]
  }, async (request, reply) => {
    try {
      const { playerId } = request.params;

      const user = await fastify.db.query(
        'SELECT id, username, pong_color, pong_skin_type, avatar_url FROM users WHERE id = ?',
        [playerId]
      );

      if (user.length === 0) {
        return reply.status(404).send({ error: 'Joueur non trouvé' });
      }

      return {
        id: user[0].id,
        name: user[0].username,
        pong_color: user[0].pong_color || '#FF0000',
        pong_skin_type: user[0].pong_skin_type || 'default',
        avatar_url: user[0].avatar_url
      };
    } catch (error) {
      fastify.log.error('Erreur récupération joueur:', error);
      return reply.status(500).send({ error: 'Erreur serveur' });
    }
  });

  // Route pour mettre à jour les paramètres de jeu du joueur
  fastify.put('/me/settings', {
    schema: {
      body: {
        type: 'object',
        properties: {
          pong_color: {
            type: 'string',
            pattern: '^#[0-9A-Fa-f]{6}$',
            description: 'Couleur au format hexadécimal (#RRGGBB)'
          },
          pong_skin_type: {
            type: 'string',
            enum: ['default', 'neon', 'wood', 'metal'],
            description: 'Type de skin pour les raquettes'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    },
    preValidation: [requireAuth]
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { pong_color, pong_skin_type } = request.body;

      const updateFields = [];
      const values = [];

      if (pong_color) {
        updateFields.push('pong_color = ?');
        values.push(pong_color);
      }

      if (pong_skin_type) {
        updateFields.push('pong_skin_type = ?');
        values.push(pong_skin_type);
      }

      if (updateFields.length === 0) {
        return reply.status(400).send({ error: 'Aucune donnée à mettre à jour' });
      }

      values.push(userId);

      await fastify.db.query(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        values
      );

      return {
        success: true,
        message: 'Paramètres mis à jour avec succès'
      };
    } catch (error) {
      fastify.log.error('Erreur mise à jour paramètres joueur:', error);
      return reply.status(500).send({ error: 'Erreur serveur' });
    }
  });
}
