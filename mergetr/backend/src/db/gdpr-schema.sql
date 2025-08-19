-- backend/src/db/gdpr-schema.sql - Tables GDPR obligatoires

-- Extension pour les données GDPR
ALTER TABLE users ADD COLUMN IF NOT EXISTS gdpr_consent BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gdpr_consent_date TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_policy_version VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS anonymized_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gdpr_status VARCHAR(20) DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Table des logs GDPR pour audit
CREATE TABLE IF NOT EXISTS gdpr_audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(50) NOT NULL, -- 'export', 'anonymize', 'delete', 'consent_update'
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table des exports GDPR
CREATE TABLE IF NOT EXISTS gdpr_exports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    export_data JSONB,
    file_path TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 days'
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_users_gdpr_status ON users(gdpr_status);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_gdpr_audit_user_id ON gdpr_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_audit_action ON gdpr_audit_log(action);

-- Vue pour les utilisateurs actifs (non supprimés/anonymisés)
CREATE OR REPLACE VIEW active_users AS
SELECT * FROM users 
WHERE deleted_at IS NULL 
AND gdpr_status IN ('active', 'consent_pending');

-- Vue pour les données anonymisées
CREATE OR REPLACE VIEW anonymized_users AS
SELECT id, username, created_at, anonymized_at
FROM users 
WHERE gdpr_status = 'anonymized';

-- Fonction de nettoyage automatique des données expirées
CREATE OR REPLACE FUNCTION cleanup_gdpr_data()
RETURNS void AS $$
BEGIN
    -- Supprimer les exports expirés
    DELETE FROM gdpr_exports WHERE expires_at < NOW();
    
    -- Supprimer les logs d'audit anciens (> 2 ans)
    DELETE FROM gdpr_audit_log WHERE created_at < NOW() - INTERVAL '2 years';
    
    -- Anonymiser les adresses IP anciennes
    UPDATE users SET ip_address = NULL 
    WHERE last_login < NOW() - INTERVAL '7 days' 
    AND ip_address IS NOT NULL;
    
    RAISE NOTICE 'GDPR data cleanup completed';
END;
$$ LANGUAGE plpgsql;

-- Déclencheur pour audit automatique
CREATE OR REPLACE FUNCTION gdpr_audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Log des changements GDPR importants
        IF OLD.gdpr_consent != NEW.gdpr_consent OR 
           OLD.gdpr_status != NEW.gdpr_status OR
           OLD.deleted_at != NEW.deleted_at THEN
            
            INSERT INTO gdpr_audit_log (user_id, action, details)
            VALUES (NEW.id, 'gdpr_data_change', 
                    jsonb_build_object(
                        'old_status', OLD.gdpr_status,
                        'new_status', NEW.gdpr_status,
                        'old_consent', OLD.gdpr_consent,
                        'new_consent', NEW.gdpr_consent
                    ));
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le déclencheur
DROP TRIGGER IF EXISTS gdpr_audit_trigger ON users;
CREATE TRIGGER gdpr_audit_trigger
    AFTER UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION gdpr_audit_trigger();

-- Tâche de nettoyage hebdomadaire (si pg_cron est disponible)
-- SELECT cron.schedule('cleanup-gdpr', '0 2 * * 0', 'SELECT cleanup_gdpr_data();');
