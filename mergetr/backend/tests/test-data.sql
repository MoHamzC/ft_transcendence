-- Script SQL pour tester le StatsService avec des données réelles
-- ft_transcendence - Tests des statistiques

-- Nettoyer les données existantes
DELETE FROM stats;
DELETE FROM leaderboard; 
DELETE FROM users WHERE email LIKE '%@stats.test';

-- Insérer des utilisateurs de test
INSERT INTO users (id, email, username, password_hash) VALUES 
    ('11111111-1111-1111-1111-111111111111', 'player1@stats.test', 'ProPlayer', '$2b$10$hashedpassword1'),
    ('22222222-2222-2222-2222-222222222222', 'player2@stats.test', 'MidPlayer', '$2b$10$hashedpassword2'),
    ('33333333-3333-3333-3333-333333333333', 'player3@stats.test', 'Newbie', '$2b$10$hashedpassword3'),
    ('44444444-4444-4444-4444-444444444444', 'player4@stats.test', 'Champion', '$2b$10$hashedpassword4'),
    ('55555555-5555-5555-5555-555555555555', 'player5@stats.test', 'Casual', '$2b$10$hashedpassword5');

-- Insérer des statistiques de test
INSERT INTO stats (user_id, games_played, games_won, games_lost) VALUES
    -- ProPlayer: 20 parties, 16 victoires, 4 défaites (80% winrate)
    ('11111111-1111-1111-1111-111111111111', 20, 16, 4),
    -- MidPlayer: 15 parties, 9 victoires, 6 défaites (60% winrate)  
    ('22222222-2222-2222-2222-222222222222', 15, 9, 6),
    -- Newbie: 5 parties, 1 victoire, 4 défaites (20% winrate)
    ('33333333-3333-3333-3333-333333333333', 5, 1, 4),
    -- Champion: 30 parties, 27 victoires, 3 défaites (90% winrate)
    ('44444444-4444-4444-4444-444444444444', 30, 27, 3),
    -- Casual: 10 parties, 5 victoires, 5 défaites (50% winrate)
    ('55555555-5555-5555-5555-555555555555', 10, 5, 5);

-- Insérer les données dans le leaderboard
INSERT INTO leaderboard (user_id, email, wins, games) VALUES
    ('44444444-4444-4444-4444-444444444444', 'player4@stats.test', 27, 30),
    ('11111111-1111-1111-1111-111111111111', 'player1@stats.test', 16, 20),
    ('22222222-2222-2222-2222-222222222222', 'player2@stats.test', 9, 15),
    ('55555555-5555-5555-5555-555555555555', 'player5@stats.test', 5, 10),
    ('33333333-3333-3333-3333-333333333333', 'player3@stats.test', 1, 5);

-- Vérifier les données insérées
SELECT 'Stats créées:' as info;
SELECT u.email, s.games_played, s.games_won, s.games_lost,
       CASE 
           WHEN s.games_played > 0 THEN ROUND((s.games_won::DECIMAL / s.games_played::DECIMAL) * 100, 2)
           ELSE 0 
       END as win_rate_calculated
FROM users u 
JOIN stats s ON u.id = s.user_id 
WHERE u.email LIKE '%@stats.test'
ORDER BY s.games_won DESC;

SELECT 'Leaderboard créé:' as info;
SELECT l.email, l.wins, l.games, l.win_rate
FROM leaderboard l 
WHERE l.email LIKE '%@stats.test'
ORDER BY l.wins DESC;
