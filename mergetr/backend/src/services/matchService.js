import pool from '../config/db.js';
import { verifyUser } from '../routes/users/user_route.js'


export default async function matchRoutes(fastify, options) {
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
  fastify.get(
    '/me',
    {
      schema: getPlayerSchema,
      preHandler: [verifyUser]
    },
    async (request, reply) => {
      try {
        const userId = request.user.id;

		console.log('User ID:', userId);

        // Changed: join with user_settings and use result.rows[0], then merge into userData
        const result = await pool.query(
          `SELECT u.id, u.username,
                  us.pong_color, us.pong_skin_type, us.avatar_url
           FROM users u
           LEFT JOIN user_settings us ON u.id = us.user_id
           WHERE u.id = $1`,
          [userId]
        );

        const user = result.rows[0];
        if (!user) {
          return reply.status(404).send({ error: 'Utilisateur non trouvé' });
        }

        const userData = {
          id: user.id,
          name: user.username,
          pong_color: user.pong_color || '#0000FF',
          pong_skin_type: user.pong_skin_type || 'color',
          avatar_url: user.avatar_url
        };

        return userData;
      } catch (error) {
        fastify.log.error('Erreur récupération joueur:', error);
        return reply.status(500).send({ error: 'Erreur serveur' });
      }
    }
  );

  // Récupérer les données d'un autre joueur (pour mode 2 joueurs)
//   fastify.get(
//     '/:playerId',
//     {
//       schema: getPlayerByIdSchema,
//       preHandler: [verifyUser]
//     },
//     async (request, reply) => {
//       try {
//         const { playerId } = request.params;

// 		console.log('Requested Player ID:', playerId);

//         // Changed: join with user_settings and use result.rows[0], then merge into userData
//         const result = await pool.query(
//           `SELECT u.id, u.username,
//                   us.pong_color, us.pong_skin_type, us.avatar_url
//            FROM users u
//            LEFT JOIN user_settings us ON u.id = us.user_id
//            WHERE u.id = $1`,
//           [playerId]
//         );

//         const user = result.rows[0];
//         if (!user) {
//           return reply.status(404).send({ error: 'Joueur non trouvé' });
//         }

//         const userData = {
//           id: user.id,
//           name: user.username,
//           pong_color: user.pong_color || '#FF0000',
//           pong_skin_type: user.pong_skin_type || 'color',
//           avatar_url: user.avatar_url
//         };

//         return userData;
//       } catch (error) {
//         fastify.log.error('Erreur récupération joueur:', error);
//         return reply.status(500).send({ error: 'Erreur serveur' });
//       }
//     }
//   );

  // Route pour enregistrer les résultats de match
  fastify.post('/match', async (request, reply) => {
    const { playerWinner, playerLoser, playerWinnerScore, playerLoserScore } = request.body;

    // Valider les données d'entrée
    if (!playerWinner || !playerLoser) {
      return reply.status(400).send({ error: 'Invalid input' });
    }

    try {
      // Enregistrer le résultat du match dans la base de données
      const result = await pool.query(
        'INSERT INTO games (player1_id, player2_id, winner_id, player1_score, player2_score) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [playerLoser, playerWinner, playerWinner, playerWinnerScore, playerLoserScore]
      );

      console.log('Match result saved:', result.rows[0]);

	  // Enregistrer le résultat personnelle dans les stats du joueur dans la base de données
      await pool.query(
        'UPDATE stats SET games_won = games_won + 1, games_played = games_played + 1 WHERE user_id = $1',
        [playerWinner]
      );
	  await pool.query(
        'UPDATE stats SET games_lost = games_lost + 1, games_played = games_played + 1 WHERE user_id = $1',
        [playerLoser]
      );

      return reply.status(201).send(result.rows[0]);
    } catch (error) {
      console.error('Error saving match result:', error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

fastify.get('/ia', async (request, reply) => {
  try {
    // Récupérer l'utilisateur IA avec ses settings
    const result = await pool.query(`
      SELECT u.id, u.username, u.name,
             us.pong_color, us.pong_skin_type
      FROM users u
      LEFT JOIN user_settings us ON u.id = us.user_id
      WHERE u.username = $1
    `, ['IA']); // Changé de 'AI' à 'IA'

    if (result.rows.length === 0) {
      return reply.code(404).send({ error: 'AI user not found' });
    }

    const aiUser = result.rows[0];
    return {
      id: aiUser.id,
      name: aiUser.name || aiUser.username, // fallback au username si pas de name
      username: aiUser.username,
      pong_color: aiUser.pong_color || '#FF0000',
      pong_skin_type: aiUser.pong_skin_type || 'color'
    };
  } catch (error) {
    fastify.log.error('Erreur récupération IA:', error);
    return reply.code(500).send({ error: 'Internal server error' });
  }
});

}
