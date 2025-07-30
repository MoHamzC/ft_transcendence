// src/routes/user.route.js

/*
 routes/user.route.js
 gestion des routes pour le menu utilisateur
*/

import { FastifyInstance } from 'fastify'
import { StatsService }       from '../services/StatsService.js'
import { LeaderboardService } from '../services/LeaderboardService.js'
import { FriendService }      from '../services/FriendService.js'
import { SettingsService }    from '../services/SettingsService.js'
import { AuthService }        from '../services/AuthService.js'

export default async function userRoutes(app /* : FastifyInstance */)
{
    /*
     on enregistre un sous-routeur pour toutes les routes /api/user/*
    */
    app.register(async function(app)
    {
        // ajoute un hook pour verifier le JWT avant chaque requete
        app.addHook('preHandler', app.authenticate)

        // GET /api/user/statistics
        app.get('/statistics', async (request, reply) =>
        {
            // recuperer l id de l utilisateur depuis le token decode
            const uid = request.user.id

            // appeler le service metier pour obtenir les stats
            const stats = await StatsService.getStats(uid)

            // renvoyer les stats
            return { stats }
        })

        // GET /api/user/leaderboard
        app.get('/leaderboard', async (request, reply) =>
        {
            // obtenir le classement global
            const board = await LeaderboardService.getBoard()

            return { leaderboard: board }
        })

        // GET /api/user/friends
        app.get('/friends', async (request, reply) =>
        {
            // recuperer l id utilisateur
            const uid = request.user.id

            // obtenir la liste d amis
            const friends = await FriendService.listFriends(uid)

            return { friends }
        })

        // GET /api/user/settings
        app.get('/settings', async (request, reply) =>
        {
            const uid      = request.user.id
            const settings = await SettingsService.getSettings(uid)

            return { settings }
        })

        // POST /api/user/logout
        app.post('/logout', async (request, reply) =>
        {
            const uid = request.user.id

            // appeler le service pour effectuer la deconnexion
            await AuthService.logout(uid)

            return { success: true }
        })
    },
    {
        // toutes ces routes sont prefixed par /api/user
        prefix: '/api/user'
    })
}
