// tests/StatsService.test.js
// Tests unitaires pour StatsService - ft_transcendence

import { StatsService } from '../src/services/StatsService.js';
import pool from '../src/config/db.js';

// Mock des données de test
const mockUserId = '11111111-1111-1111-1111-111111111111';
const mockStats = {
    games_played: 20,
    games_won: 16,
    games_lost: 4
};

// Mock de pool.query
const mockPoolQuery = jest.fn();
pool.query = mockPoolQuery;

describe('StatsService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getStats', () => {
        test('should return formatted stats for existing user', async () => {
            // Arrange
            mockPoolQuery.mockResolvedValue({ rows: [mockStats] });

            // Act
            const result = await StatsService.getStats(mockUserId);

            // Assert
            expect(mockPoolQuery).toHaveBeenCalledWith(
                expect.stringContaining('SELECT games_played, games_won, games_lost'),
                [mockUserId]
            );
            
            expect(result).toEqual({
                gamesPlayed: 20,
                gamesWon: 16,
                gamesLost: 4,
                winRate: 80 // 16/20 * 100 = 80%
            });
        });

        test('should return zero stats for user with no data', async () => {
            // Arrange
            mockPoolQuery.mockResolvedValue({ rows: [] });

            // Act
            const result = await StatsService.getStats(mockUserId);

            // Assert
            expect(result).toEqual({
                gamesPlayed: 0,
                gamesWon: 0,
                gamesLost: 0,
                winRate: 0
            });
        });

        test('should calculate win rate correctly for different scenarios', async () => {
            const testCases = [
                // [games_played, games_won, expected_winRate]
                [10, 5, 50],    // 50%
                [10, 10, 100],  // 100%
                [10, 0, 0],     // 0%
                [3, 1, 33],     // 33.33% arrondi à 33%
                [7, 5, 71],     // 71.43% arrondi à 71%
                [0, 0, 0]       // Division par zéro
            ];

            for (const [played, won, expectedWinRate] of testCases) {
                mockPoolQuery.mockResolvedValue({ 
                    rows: [{ 
                        games_played: played, 
                        games_won: won, 
                        games_lost: played - won 
                    }] 
                });

                const result = await StatsService.getStats(mockUserId);
                
                expect(result.winRate).toBe(expectedWinRate);
                expect(result.gamesPlayed).toBe(played);
                expect(result.gamesWon).toBe(won);
            }
        });

        test('should handle database errors gracefully', async () => {
            // Arrange
            const dbError = new Error('Database connection failed');
            mockPoolQuery.mockRejectedValue(dbError);

            // Act & Assert
            await expect(StatsService.getStats(mockUserId))
                .rejects.toThrow('Database connection failed');
        });

        test('should use correct SQL query format', async () => {
            // Arrange
            mockPoolQuery.mockResolvedValue({ rows: [mockStats] });

            // Act
            await StatsService.getStats(mockUserId);

            // Assert
            const [query, params] = mockPoolQuery.mock.calls[0];
            
            // Vérifier que la requête contient les bonnes colonnes
            expect(query).toMatch(/SELECT\s+games_played,\s*games_won,\s*games_lost/i);
            expect(query).toMatch(/FROM\s+stats/i);
            expect(query).toMatch(/WHERE\s+user_id\s*=\s*\$1/i);
            
            // Vérifier les paramètres
            expect(params).toEqual([mockUserId]);
        });

        test('should format camelCase properties correctly', async () => {
            // Arrange
            const dbStats = {
                games_played: 15,
                games_won: 9,
                games_lost: 6
            };
            mockPoolQuery.mockResolvedValue({ rows: [dbStats] });

            // Act
            const result = await StatsService.getStats(mockUserId);

            // Assert - Vérifier que les propriétés sont en camelCase
            expect(result).toHaveProperty('gamesPlayed');
            expect(result).toHaveProperty('gamesWon');
            expect(result).toHaveProperty('gamesLost');
            expect(result).toHaveProperty('winRate');
            
            // Vérifier qu'il n'y a pas de propriétés snake_case
            expect(result).not.toHaveProperty('games_played');
            expect(result).not.toHaveProperty('games_won');
            expect(result).not.toHaveProperty('games_lost');
        });
    });
});

// Tests d'intégration (nécessitent une vraie DB)
describe('StatsService Integration Tests', () => {
    // Ces tests nécessitent une base de données de test
    // Ils peuvent être exécutés avec une DB Docker temporaire
    
    beforeAll(async () => {
        // Setup: Créer des données de test
        // Note: Nécessite une vraie connexion DB pour l'intégration
    });

    afterAll(async () => {
        // Cleanup: Nettoyer les données de test
    });

    test('should work with real database', async () => {
        // Ce test nécessite une vraie DB
        // Il peut être ignoré dans l'environnement de CI/CD
        if (process.env.NODE_ENV === 'test' && process.env.DB_URL) {
            const testUserId = 'test-user-id';
            const result = await StatsService.getStats(testUserId);
            
            expect(result).toHaveProperty('gamesPlayed');
            expect(result).toHaveProperty('gamesWon');
            expect(result).toHaveProperty('gamesLost');
            expect(result).toHaveProperty('winRate');
        }
    });
});
