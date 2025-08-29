-- Schema SQL pour ft_transcendence
-- Basé sur l'analyse du code backend

-- Enable pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- Table principale des utilisateurs (merge de users et usertest)
CREATE TABLE users (
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des amitiés
CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(requester_id, addressee_id)
);

-- Table des statistiques de jeu
CREATE TABLE stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    games_played INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    games_lost INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Vue/Table pour le leaderboard (classement)
CREATE TABLE leaderboard (
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

-- Table des parties de jeu (optionnelle, pour tracker les parties)
CREATE TABLE games (
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

CREATE TABLE user_settings (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    avatar_url TEXT,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    language VARCHAR(10) DEFAULT 'FR',
    add_friend BOOLEAN DEFAULT TRUE,
    profile_private BOOLEAN DEFAULT FALSE,
    pong_color VARCHAR(7) DEFAULT '#FFFFFF', -- Couleur hexadécimale pour le skin Pong
    pong_skin_type VARCHAR(20) DEFAULT 'color' CHECK (pong_skin_type IN ('color', 'avatar')) -- Choix entre couleur ou avatar
);

-- Index pour améliorer les performances
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_github_id ON users(github_id);
CREATE INDEX idx_users_intra42_id ON users(intra42_id);
CREATE INDEX idx_users_providers ON users USING GIN(providers);
CREATE INDEX idx_friendships_requester ON friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX idx_stats_user ON stats(user_id);
CREATE INDEX idx_leaderboard_wins ON leaderboard(wins DESC);
CREATE INDEX idx_games_players ON games(player1_id, player2_id);
CREATE INDEX idx_games_winner ON games(winner_id);

-- Triggers pour mettre à jour les timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON friendships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stats_updated_at BEFORE UPDATE ON stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leaderboard_updated_at BEFORE UPDATE ON leaderboard
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
