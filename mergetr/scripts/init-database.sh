#!/bin/bash
# init-database.sh - Script d'initialisation automatique de la base de données

set -e

echo "🗄️ Initialisation de la base de données PostgreSQL..."

# Attendre que PostgreSQL soit prêt
echo "⏳ Attente de PostgreSQL..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "${POSTGRES_HOST:-db}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c "SELECT 1;" >/dev/null 2>&1; then
        echo "✅ PostgreSQL est prêt !"
        break
    fi

    echo "⏳ Tentative $attempt/$max_attempts - PostgreSQL pas encore prêt..."
    sleep 2
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    echo "❌ Timeout: PostgreSQL n'est pas prêt après $max_attempts tentatives"
    exit 1
fi

# Vérifier si les tables existent déjà
if PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "${POSTGRES_HOST:-db}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c "SELECT 1 FROM users LIMIT 1;" >/dev/null 2>&1; then
    echo "ℹ️  Base de données déjà initialisée, skipping..."
    exit 0
fi

echo "📝 Application du schéma de base de données..."

# Appliquer le schéma
PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "${POSTGRES_HOST:-db}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -f /app/database/schema.sql

echo "✅ Schéma de base de données appliqué avec succès !"

# Créer un utilisateur admin par défaut si nécessaire
if ! PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "${POSTGRES_HOST:-db}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c "SELECT 1 FROM users WHERE email = 'admin@ft-transcendence.com';" | grep -q "1"; then
    echo "👤 Création d'un utilisateur admin par défaut..."
    # Générer un hash pour le mot de passe admin par défaut
    ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}"
    ADMIN_HASH=$(echo -n "$ADMIN_PASSWORD" | sha256sum | cut -d' ' -f1)
    PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "${POSTGRES_HOST:-db}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c "
        INSERT INTO users (email, username, password_hash)
        VALUES ('admin@ft-transcendence.com', 'admin', '$ADMIN_HASH');
    "
    echo "✅ Utilisateur admin créé (mot de passe: $ADMIN_PASSWORD)"
fi

echo "🎉 Initialisation de la base de données terminée !"
