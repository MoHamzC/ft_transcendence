// src/services/LeaderboardService.js

export class LeaderboardService
{
    static async getBoard()
    {
        // TODO: pareil que StatsService, real logic to compute leaderboard
        return [
            { id: 1, email: 'alpha@42.fr', score: 1000 },
            { id: 2, email: 'beta@42.fr', score: 950 }
        ];
    }
}
