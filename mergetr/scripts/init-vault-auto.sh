#!/bin/bash
# init-vault-auto.sh - Script d'initialisation automatique de Vault

set -e

# Load environment variables from .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
    echo "Loaded .env"
else
    echo ".env not found"
fi

echo "🔐 Initialisation automatique de Vault..."

# Configuration Vault - Détecter si on est dans Docker ou en local
if [ -n "$DOCKER_ENV" ] || [ -f /.dockerenv ]; then
    # On est dans Docker, utiliser le nom du service
    VAULT_ADDR="http://vault:8200"
    echo "🐳 Environnement Docker détecté"
else
    # On est en local, utiliser localhost
    VAULT_ADDR="http://localhost:8200"
    echo "🖥️  Environnement local détecté"
fi

VAULT_TOKEN="${VAULT_TOKEN:-myroot}"

echo "VAULT_ADDR: $VAULT_ADDR"
echo "VAULT_TOKEN: $VAULT_TOKEN"

export VAULT_ADDR
export VAULT_TOKEN

# Installer vault CLI si nécessaire
if ! command -v vault &> /dev/null; then
    echo "📦 Installation de Vault CLI..."
    apk add --no-cache vault 2>/dev/null || {
        echo "⚠️  Impossible d'installer vault CLI via apk, téléchargement direct..."
        wget -q https://releases.hashicorp.com/vault/1.15.6/vault_1.15.6_linux_amd64.zip -O /tmp/vault.zip
        unzip -q /tmp/vault.zip -d /tmp/
        mv /tmp/vault /usr/local/bin/
        chmod +x /usr/local/bin/vault
        rm /tmp/vault.zip
    }
fi

# Attendre que Vault soit prêt
echo "⏳ Attente de Vault..."
max_attempts=10
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -s "$VAULT_ADDR/v1/sys/health" >/dev/null 2>&1; then
        echo "✅ Vault est prêt !"
        break
    fi

    echo "⏳ Tentative $attempt/$max_attempts - Vault pas encore prêt..."
    sleep 3
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    echo "❌ Timeout: Vault n'est pas prêt après $max_attempts tentatives"
    exit 1
fi

echo "🔧 Configuration du moteur de secrets..."

# Activer le moteur de secrets KV version 2
vault secrets enable -version=2 -path=secret kv 2>/dev/null || echo "ℹ️  Moteur de secrets déjà activé"

echo "📝 Configuration des secrets par défaut..."

# Secret de base de données
if [ -n "$POSTGRES_USER" ] && [ -n "$POSTGRES_PASSWORD" ]; then
    vault kv put secret/database \
        user="$POSTGRES_USER" \
        host="${POSTGRES_HOST:-db}" \
        database="${POSTGRES_DB:-db_transcendence}" \
        password="$POSTGRES_PASSWORD" \
        port="${POSTGRES_PORT:-5432}" 2>/dev/null || echo "ℹ️  Secret database déjà configuré"
else
    echo "⚠️  Variables POSTGRES_USER et POSTGRES_PASSWORD non définies, skipping database secret"
fi

# Secret JWT
if [ -n "$JWT_SECRET" ]; then
    vault kv put secret/jwt secret="$JWT_SECRET" 2>/dev/null || echo "ℹ️  Secret JWT déjà configuré"
else
    echo "⚠️  Variable JWT_SECRET non définie, skipping JWT secret"
fi

# Secret email (optionnel)
if [ -n "$SMTP_USER" ] && [ -n "$SMTP_PASSWORD" ]; then
    vault kv put secret/email \
        smtp_host="${SMTP_HOST:-smtp.gmail.com}" \
        smtp_port="${SMTP_PORT:-587}" \
        smtp_user="$SMTP_USER" \
        smtp_password="$SMTP_PASSWORD" 2>/dev/null || echo "ℹ️  Secret email déjà configuré"
else
    echo "ℹ️  Variables SMTP non définies, skipping email secret"
fi

# Secrets OAuth (optionnels)
if [ -n "$CLIENT_ID_42" ] && [ -n "$CLIENT_SECRET_42" ]; then
    vault kv put secret/oauth/42 \
        client_id="$CLIENT_ID_42" \
        client_secret="$CLIENT_SECRET_42" 2>/dev/null || echo "ℹ️  Secret OAuth 42 déjà configuré"
else
    echo "ℹ️  Variables OAuth 42 non définies, skipping OAuth 42 secret"
fi

if [ -n "$CLIENT_ID_GITHUB" ] && [ -n "$CLIENT_SECRET_GITHUB" ]; then
    vault kv put secret/oauth/github \
        client_id="$CLIENT_ID_GITHUB" \
        client_secret="$CLIENT_SECRET_GITHUB" 2>/dev/null || echo "ℹ️  Secret OAuth GitHub déjà configuré"
else
    echo "ℹ️  Variables OAuth GitHub non définies, skipping OAuth GitHub secret"
fi

if [ -n "$CLIENT_ID_GOOGLE" ] && [ -n "$CLIENT_SECRET_GOOGLE" ]; then
    vault kv put secret/oauth/google \
        client_id="$CLIENT_ID_GOOGLE" \
        client_secret="$CLIENT_SECRET_GOOGLE" 2>/dev/null || echo "ℹ️  Secret OAuth Google déjà configuré"
else
    echo "ℹ️  Variables OAuth Google non définies, skipping OAuth Google secret"
fi

echo "✅ Secrets Vault configurés avec succès !"
echo "🎉 Initialisation de Vault terminée !"
