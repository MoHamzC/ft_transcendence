-- Schema SQL pour les tournois ft_transcendence
-- Support tournois 4 et 8 joueurs en local

-- Enable pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Table des tournois
CREATE TABLE IF NOT EXISTS tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    mode VARCHAR(10) NOT NULL CHECK (mode IN ('4_players', '8_players')), -- Nouveau champ mode
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

-- Index pour améliorer les performances (uniquement si ils n'existent pas)
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

-- Fonction pour mettre à jour updated_at (si elle n'existe pas)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour les timestamps (uniquement si il n'existe pas)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tournaments_updated_at') THEN
        CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON tournaments
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
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
