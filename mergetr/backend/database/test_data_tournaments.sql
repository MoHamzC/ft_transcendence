-- Données de test pour le système de tournois
-- À exécuter après le schema principal et tournament_schema.sql

-- Insérer des utilisateurs de test
INSERT INTO users (id, email, username, password) VALUES
('00000000-0000-0000-0000-000000000001', 'alice@test.com', 'alice', '$2b$10$hashedpassword1'),
('00000000-0000-0000-0000-000000000002', 'bob@test.com', 'bob', '$2b$10$hashedpassword2'),
('00000000-0000-0000-0000-000000000003', 'charlie@test.com', 'charlie', '$2b$10$hashedpassword3'),
('00000000-0000-0000-0000-000000000004', 'diana@test.com', 'diana', '$2b$10$hashedpassword4'),
('00000000-0000-0000-0000-000000000005', 'eve@test.com', 'eve', '$2b$10$hashedpassword5'),
('00000000-0000-0000-0000-000000000006', 'frank@test.com', 'frank', '$2b$10$hashedpassword6'),
('00000000-0000-0000-0000-000000000007', 'grace@test.com', 'grace', '$2b$10$hashedpassword7'),
('00000000-0000-0000-0000-000000000008', 'henry@test.com', 'henry', '$2b$10$hashedpassword8')
ON CONFLICT (email) DO NOTHING;

-- Insérer des statistiques de base pour ces utilisateurs
INSERT INTO stats (user_id, games_played, games_won, games_lost) VALUES
('00000000-0000-0000-0000-000000000001', 5, 3, 2),
('00000000-0000-0000-0000-000000000002', 8, 4, 4),
('00000000-0000-0000-0000-000000000003', 3, 2, 1),
('00000000-0000-0000-0000-000000000004', 6, 1, 5),
('00000000-0000-0000-0000-000000000005', 4, 4, 0),
('00000000-0000-0000-0000-000000000006', 7, 3, 4),
('00000000-0000-0000-0000-000000000007', 2, 1, 1),
('00000000-0000-0000-0000-000000000008', 9, 6, 3)
ON CONFLICT (user_id) DO NOTHING;

-- Créer un tournoi de test pré-configuré
INSERT INTO tournaments (id, name, description, max_players, status, type) VALUES
('10000000-0000-0000-0000-000000000001', 'Tournoi de Test - Complet', 'Tournoi avec 4 joueurs pour les tests', 4, 'registration', 'elimination');

-- Inscrire 4 joueurs au tournoi de test
INSERT INTO tournament_participants (tournament_id, user_id, alias, registration_order) VALUES
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'AliceTheBest', 1),
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'BobTheBuilder', 2),
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'CharlieChamp', 3),
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'DianaWarrior', 4);

-- Créer un tournoi vide pour tester les inscriptions
INSERT INTO tournaments (id, name, description, max_players, status, type) VALUES
('10000000-0000-0000-0000-000000000002', 'Tournoi Ouvert', 'Tournoi pour tester les inscriptions', 8, 'registration', 'elimination');
