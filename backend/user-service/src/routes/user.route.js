// src/routes/user.route.js

/*
 routes/user.route.js
 gestion des routes pour le menu utilisateur
*/

import { StatsService }       from '../services/StatsService.js';
import { LeaderboardService } from '../services/LeaderboardService.js';
import { FriendService }      from '../services/FriendService.js';
import { SettingsService }    from '../services/SettingsService.js';
import { AuthService }        from '../services/AuthService.js';

export default async function userRoutes(app /* : FastifyInstance */)
{
    // 🔐 Ajout du middleware JWT pour toutes les routes
    app.addHook('preHandler', app.authenticate);

    // GET /api/user/statistics
    app.get('/statistics', async (request, reply) =>
    {
        const uid    = request.user.id;
        const stats  = await StatsService.getStats(uid);
        return { stats };
    });

    // GET /api/user/leaderboard
    app.get('/leaderboard', async (request, reply) =>
    {
        const board = await LeaderboardService.getBoard();
        return { leaderboard: board };
    });

    // GET /api/user/friends
    app.get('/friends', async (request, reply) =>
    {
        const uid     = request.user.id;
        const friends = await FriendService.listFriends(uid);
        return { friends };
    });

    // GET /api/user/settings
    app.get('/settings', async (request, reply) =>
    {
        const uid      = request.user.id;
        const settings = await SettingsService.getSettings(uid);
        return { settings };
    });

    // POST /api/user/logout
    app.post('/logout', async (request, reply) =>
    {
        const uid = request.user.id;
        await AuthService.logout(uid);
        return { success: true };
    });
}
