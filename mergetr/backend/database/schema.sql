-- Schema SQL complet pour ft_transcendence
-- Merge propre des schémas principal et tournois

-- Enable pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- TABLES PRINCIPALES (USERS, FRIENDS, STATS, GAMES)
-- =============================================================================

-- Table principale des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100),
    username VARCHAR(30) NOT NULL,
    password_hash VARCHAR(255),
    otp_code VARCHAR(6),
    otp_generated_at TIMESTAMP,
    google_id VARCHAR(255) UNIQUE,
    github_id VARCHAR(255) UNIQUE,
    intra42_id VARCHAR(255) UNIQUE,
    providers TEXT[] DEFAULT '{}',
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_online BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des amitiés
CREATE TABLE IF NOT EXISTS friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(requester_id, addressee_id)
);

-- Table des statistiques de jeu
CREATE TABLE IF NOT EXISTS stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    games_played INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    games_lost INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Table pour le leaderboard (classement)
CREATE TABLE IF NOT EXISTS leaderboard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    wins INTEGER DEFAULT 0,
    games INTEGER DEFAULT 0,
    win_rate DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE
            WHEN games > 0 THEN ROUND((wins::DECIMAL / games::DECIMAL) * 100, 2)
            ELSE 0
        END
    ) STORED,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Table des parties de jeu
CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    player2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    winner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    player1_score INTEGER DEFAULT 0,
    player2_score INTEGER DEFAULT 0,
    game_type VARCHAR(50) DEFAULT 'pong',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'finished', 'cancelled')),
    started_at TIMESTAMP,
    finished_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des paramètres utilisateur
CREATE TABLE IF NOT EXISTS user_settings (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    avatar_url TEXT,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    language VARCHAR(10) DEFAULT 'FR',
    add_friend BOOLEAN DEFAULT TRUE,
    profile_private BOOLEAN DEFAULT FALSE,
    pong_color VARCHAR(7) DEFAULT '#FFFFFF',
    pong_skin_type VARCHAR(20) DEFAULT 'color' CHECK (pong_skin_type IN ('color', 'avatar'))
);

-- =============================================================================
-- TABLES TOURNOIS
-- =============================================================================

-- Table des tournois
CREATE TABLE IF NOT EXISTS tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    mode VARCHAR(10) NOT NULL CHECK (mode IN ('4_players', '8_players')),
    max_players INTEGER NOT NULL CHECK (max_players IN (4, 8)),
    status VARCHAR(20) DEFAULT 'registration' CHECK (status IN ('registration', 'in_progress', 'finished', 'cancelled')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    winner_id UUID, -- Sera ajouté comme contrainte après création de tournament_participants
    started_at TIMESTAMP,
    finished_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des participants au tournoi (avec ou sans compte utilisateur)
CREATE TABLE IF NOT EXISTS tournament_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL si joueur invité
    alias VARCHAR(50) NOT NULL, -- Nom affiché dans le tournoi
    registration_order INTEGER NOT NULL,
    is_eliminated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tournament_id, alias), -- Alias unique par tournoi
    UNIQUE(tournament_id, user_id) -- Un utilisateur ne peut s'inscrire qu'une fois par tournoi
);

-- Table des matchs du tournoi
CREATE TABLE IF NOT EXISTS tournament_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    match_number INTEGER NOT NULL,
    player1_id UUID REFERENCES tournament_participants(id) ON DELETE SET NULL,
    player2_id UUID REFERENCES tournament_participants(id) ON DELETE SET NULL,
    winner_id UUID REFERENCES tournament_participants(id) ON DELETE SET NULL,
    player1_score INTEGER DEFAULT 0,
    player2_score INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'finished')),
    started_at TIMESTAMP,
    finished_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tournament_id, round_number, match_number)
);

-- =============================================================================
-- CONTRAINTES ADDITIONNELLES
-- =============================================================================

-- Ajouter la contrainte de clé étrangère pour winner_id après création des tables
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tournaments_winner_id_fkey'
    ) THEN
        ALTER TABLE tournaments 
        ADD CONSTRAINT tournaments_winner_id_fkey 
        FOREIGN KEY (winner_id) REFERENCES tournament_participants(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Contrainte pour s'assurer que le mode correspond au max_players
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_mode_max_players'
    ) THEN
        ALTER TABLE tournaments ADD CONSTRAINT check_mode_max_players 
        CHECK (
            (mode = '4_players' AND max_players = 4) OR 
            (mode = '8_players' AND max_players = 8)
        );
    END IF;
END $$;

-- =============================================================================
-- INDEX POUR PERFORMANCES
-- =============================================================================

-- Index pour les tables principales
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_email') THEN
        CREATE INDEX idx_users_email ON users(email);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_google_id') THEN
        CREATE INDEX idx_users_google_id ON users(google_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_github_id') THEN
        CREATE INDEX idx_users_github_id ON users(github_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_intra42_id') THEN
        CREATE INDEX idx_users_intra42_id ON users(intra42_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_providers') THEN
        CREATE INDEX idx_users_providers ON users USING GIN(providers);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_last_seen') THEN
        CREATE INDEX idx_users_last_seen ON users(last_seen);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_online') THEN
        CREATE INDEX idx_users_online ON users(is_online);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_friendships_requester') THEN
        CREATE INDEX idx_friendships_requester ON friendships(requester_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_friendships_addressee') THEN
        CREATE INDEX idx_friendships_addressee ON friendships(addressee_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_stats_user') THEN
        CREATE INDEX idx_stats_user ON stats(user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_leaderboard_wins') THEN
        CREATE INDEX idx_leaderboard_wins ON leaderboard(wins DESC);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_games_players') THEN
        CREATE INDEX idx_games_players ON games(player1_id, player2_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_games_winner') THEN
        CREATE INDEX idx_games_winner ON games(winner_id);
    END IF;
END $$;

-- Index pour les tournois
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tournaments_status') THEN
        CREATE INDEX idx_tournaments_status ON tournaments(status);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tournaments_created_by') THEN
        CREATE INDEX idx_tournaments_created_by ON tournaments(created_by);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tournaments_mode') THEN
        CREATE INDEX idx_tournaments_mode ON tournaments(mode);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tournament_participants_tournament') THEN
        CREATE INDEX idx_tournament_participants_tournament ON tournament_participants(tournament_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tournament_participants_user') THEN
        CREATE INDEX idx_tournament_participants_user ON tournament_participants(user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tournament_matches_tournament') THEN
        CREATE INDEX idx_tournament_matches_tournament ON tournament_matches(tournament_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tournament_matches_round') THEN
        CREATE INDEX idx_tournament_matches_round ON tournament_matches(tournament_id, round_number);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tournament_matches_status') THEN
        CREATE INDEX idx_tournament_matches_status ON tournament_matches(status);
    END IF;
END $$;

-- =============================================================================
-- TRIGGERS ET FONCTIONS
-- =============================================================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour les tables principales
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_friendships_updated_at') THEN
        CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON friendships
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_stats_updated_at') THEN
        CREATE TRIGGER update_stats_updated_at BEFORE UPDATE ON stats
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_leaderboard_updated_at') THEN
        CREATE TRIGGER update_leaderboard_updated_at BEFORE UPDATE ON leaderboard
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Trigger pour les tournois
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tournaments_updated_at') THEN
        CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON tournaments
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
