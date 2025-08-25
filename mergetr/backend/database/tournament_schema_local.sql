-- Schema SQL pour la gestion des tournois LOCAL UNIQUEMENT
-- Complément au schema.sql existant - VERSION SIMPLIFIÉE

-- Table des tournois
CREATE TABLE IF NOT EXISTS tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    max_players INTEGER DEFAULT 8 CHECK (max_players >= 2 AND max_players <= 32),
    status VARCHAR(20) DEFAULT 'registration' CHECK (status IN ('registration', 'in_progress', 'finished', 'cancelled')),
    type VARCHAR(20) DEFAULT 'elimination' CHECK (type IN ('elimination', 'round_robin')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    finished_at TIMESTAMP,
    winner_id UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Table des participants au tournoi
CREATE TABLE IF NOT EXISTS tournament_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Peut être NULL pour joueurs sans compte
    alias VARCHAR(50) NOT NULL, -- Nom d'affichage pour le tournoi
    registration_order INTEGER, -- Ordre d'inscription
    is_eliminated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tournament_id, user_id), -- Un utilisateur ne peut s'inscrire qu'une fois
    UNIQUE(tournament_id, alias)    -- Alias unique par tournoi
);

-- Table des matchs du tournoi (VERSION LOCALE SIMPLIFIÉE)
CREATE TABLE IF NOT EXISTS tournament_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    match_number INTEGER NOT NULL, -- Position dans le round
    player1_id UUID REFERENCES tournament_participants(id) ON DELETE SET NULL,
    player2_id UUID REFERENCES tournament_participants(id) ON DELETE SET NULL,
    winner_id UUID REFERENCES tournament_participants(id) ON DELETE SET NULL,
    player1_score INTEGER DEFAULT 0,
    player2_score INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'finished', 'cancelled')),
    scheduled_at TIMESTAMP,
    started_at TIMESTAMP,
    finished_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament ON tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_user ON tournament_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament ON tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_round ON tournament_matches(tournament_id, round_number);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_status ON tournament_matches(status);

-- Triggers pour les timestamps (si la fonction existe)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        DROP TRIGGER IF EXISTS update_tournaments_updated_at ON tournaments;
        CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON tournaments
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            
        DROP TRIGGER IF EXISTS update_tournament_participants_updated_at ON tournament_participants;
        CREATE TRIGGER update_tournament_participants_updated_at BEFORE UPDATE ON tournament_participants
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Contraintes pour assurer l'intégrité des données
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name='tournament_matches' AND constraint_name='check_different_players'
    ) THEN
        ALTER TABLE tournament_matches 
        ADD CONSTRAINT check_different_players 
        CHECK (player1_id != player2_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name='tournament_matches' AND constraint_name='check_winner_is_player'
    ) THEN
        ALTER TABLE tournament_matches 
        ADD CONSTRAINT check_winner_is_player 
        CHECK (winner_id IS NULL OR winner_id = player1_id OR winner_id = player2_id);
    END IF;
END $$;

-- Vue pour les statistiques des tournois (VERSION SIMPLIFIÉE)
CREATE OR REPLACE VIEW tournament_stats AS
SELECT 
    t.id,
    t.name,
    t.status,
    COUNT(tp.id) as total_participants,
    COUNT(CASE WHEN tm.status = 'finished' THEN 1 END) as completed_matches,
    COUNT(CASE WHEN tm.status = 'pending' THEN 1 END) as pending_matches,
    MAX(tm.round_number) as current_round
FROM tournaments t
LEFT JOIN tournament_participants tp ON t.id = tp.tournament_id
LEFT JOIN tournament_matches tm ON t.id = tm.tournament_id
GROUP BY t.id, t.name, t.status;

-- NETTOYAGE : Supprimer les colonnes obsolètes si elles existent
DO $$ 
BEGIN
    -- Supprimer game_rules si elle existe
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tournament_matches' AND column_name='game_rules') THEN
        ALTER TABLE tournament_matches DROP COLUMN game_rules;
    END IF;
    
    -- Supprimer game_metadata si elle existe
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tournament_matches' AND column_name='game_metadata') THEN
        ALTER TABLE tournament_matches DROP COLUMN game_metadata;
    END IF;
END $$;

-- NETTOYAGE : Supprimer la table de notifications si elle existe
DROP TABLE IF EXISTS tournament_notifications;
