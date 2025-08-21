-- Migration pour ajouter les améliorations des tournois
-- Version: 2024-08-21-tournament-improvements

-- Ajouter les nouvelles colonnes aux tables existantes si elles n'existent pas

-- Vérifier et ajouter game_rules à tournament_matches
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tournament_matches' AND column_name='game_rules') THEN
        ALTER TABLE tournament_matches ADD COLUMN game_rules JSONB;
    END IF;
END $$;

-- Vérifier et ajouter game_metadata à tournament_matches  
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tournament_matches' AND column_name='game_metadata') THEN
        ALTER TABLE tournament_matches ADD COLUMN game_metadata JSONB;
    END IF;
END $$;

-- Créer la table tournament_notifications si elle n'existe pas
CREATE TABLE IF NOT EXISTS tournament_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ajouter les index manquants
CREATE INDEX IF NOT EXISTS idx_tournament_notifications_tournament ON tournament_notifications(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_notifications_type ON tournament_notifications(type);
CREATE INDEX IF NOT EXISTS idx_tournament_notifications_created ON tournament_notifications(created_at DESC);

-- Modifier la contrainte sur tournament_participants pour permettre user_id NULL
DO $$ 
BEGIN
    -- Supprimer la contrainte UNIQUE existante si elle existe
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name='tournament_participants' 
        AND constraint_name='tournament_participants_tournament_id_user_id_key'
    ) THEN
        ALTER TABLE tournament_participants DROP CONSTRAINT tournament_participants_tournament_id_user_id_key;
    END IF;
    
    -- Ajouter la nouvelle contrainte qui permet user_id NULL
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name='tournament_participants' 
        AND constraint_name='tournament_participants_unique_user_per_tournament'
    ) THEN
        ALTER TABLE tournament_participants 
        ADD CONSTRAINT tournament_participants_unique_user_per_tournament 
        UNIQUE (tournament_id, user_id) DEFERRABLE INITIALLY DEFERRED;
    END IF;
END $$;

-- Ajouter les contraintes de validation
DO $$ 
BEGIN
    -- Contrainte pour s'assurer que les joueurs sont différents
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name='tournament_matches' 
        AND constraint_name='check_different_players'
    ) THEN
        ALTER TABLE tournament_matches 
        ADD CONSTRAINT check_different_players 
        CHECK (player1_id != player2_id);
    END IF;

    -- Contrainte pour s'assurer que le gagnant est l'un des joueurs
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name='tournament_matches' 
        AND constraint_name='check_winner_is_player'
    ) THEN
        ALTER TABLE tournament_matches 
        ADD CONSTRAINT check_winner_is_player 
        CHECK (winner_id IS NULL OR winner_id = player1_id OR winner_id = player2_id);
    END IF;
END $$;

-- Créer la vue tournament_stats si elle n'existe pas
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

-- Insérer des règles par défaut pour les matchs existants sans règles
UPDATE tournament_matches 
SET game_rules = '{"paddle_speed": 5, "ball_speed": 3, "win_score": 5, "rules_enforced": true, "game_type": "pong"}'
WHERE game_rules IS NULL;

-- Ajouter des notifications de migration
INSERT INTO tournament_notifications (tournament_id, type, message, data, created_at)
SELECT 
    t.id,
    'system_migration',
    'Système de tournoi mis à jour avec les nouvelles fonctionnalités',
    '{"migration": "tournament-improvements", "features": ["uniform_rules", "notifications", "no_account_registration"]}',
    CURRENT_TIMESTAMP
FROM tournaments t
WHERE t.status IN ('registration', 'in_progress')
ON CONFLICT DO NOTHING;

-- Mise à jour réussie
SELECT 'Migration des améliorations de tournoi terminée avec succès' as status;
