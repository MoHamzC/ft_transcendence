#!/bin/bash
# start-robust.sh - Démarrage robuste (production-like) pour docker-compose.secure.yml

set -euo pipefail

COMPOSE_FILE="docker-compose.secure.yml"
PROJECT_NAME="ft_transcendence"

echo "🚀 Démarrage robuste de ft_transcendence (secure compose)"

# 1. Détection docker / compose
if ! command -v docker &>/dev/null; then echo "❌ Docker manquant"; exit 1; fi
if docker compose version &>/dev/null; then COMPOSE_CMD="docker compose"; elif command -v docker-compose &>/dev/null; then COMPOSE_CMD="docker-compose"; else echo "❌ Docker Compose indisponible"; exit 1; fi

# 2. Charger .env (non destructif)
if [ -f .env ]; then
    echo "📦 Chargement .env"
    set -a; # shellcheck disable=SC2046
    export $(grep -E '^[A-Za-z_][A-Za-z0-9_]*=' .env | xargs); set +a
fi

# 3. SSL certs
if [ ! -f ssl/key.pem ] || [ ! -f ssl/cert.pem ]; then
    echo "🔐 Génération certificats auto-signés (ssl/)"
    mkdir -p ssl
    openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/C=FR/ST=Paris/L=Paris/O=42/OU=ft_transcendence/CN=localhost" >/dev/null 2>&1
fi

# 4. Lancer base (db + vault) en premier
echo "🐳 Démarrage services de base (db, vault)"
$COMPOSE_CMD -f "$COMPOSE_FILE" up -d db vault

# 5. Attente DB via pg_isready
echo "⏳ Attente PostgreSQL healthy..."
for i in {1..30}; do
    if $COMPOSE_CMD -f "$COMPOSE_FILE" exec -T db pg_isready -U "${POSTGRES_USER:-admin}" -d "${POSTGRES_DB:-db_transcendence}" >/dev/null 2>&1; then
        echo "✅ PostgreSQL prêt"; break; fi; sleep 1; if [ "$i" = 30 ]; then echo "❌ PostgreSQL non prêt"; exit 1; fi
done

# 5b. Vérification connexion SQL réelle (parfois pg_isready OK avant socket prêt)
echo "⏳ Validation connexion SQL..."
for i in {1..15}; do
    if $COMPOSE_CMD -f "$COMPOSE_FILE" exec -T db sh -c "psql -h 127.0.0.1 -U ${POSTGRES_USER:-admin} -d ${POSTGRES_DB:-db_transcendence} -c 'SELECT 1;'" >/dev/null 2>&1; then
        echo "✅ Connexion SQL opérationnelle"; break; fi; sleep 1; if [ "$i" = 15 ]; then echo "❌ Connexion SQL toujours indisponible"; exit 1; fi
done

# 6. Vérifier / appliquer schéma si tables manquantes
echo "🗄️  Vérification schéma..."
if ! $COMPOSE_CMD -f "$COMPOSE_FILE" exec -T db sh -c "psql -h 127.0.0.1 -U ${POSTGRES_USER:-admin} -d ${POSTGRES_DB:-db_transcendence} -c 'SELECT 1 FROM users LIMIT 1;'" >/dev/null 2>&1; then
    echo "📝 Application schéma (fallback)"
    SCHEMA_FILE="backend/database/schema.sql"
    if [ -f "$SCHEMA_FILE" ]; then
        DB_USER="${POSTGRES_USER:-admin}"; DB_NAME="${POSTGRES_DB:-db_transcendence}"
        echo "   → Injection via stdin (évite docker cp / lchown)"
    if $COMPOSE_CMD -f "$COMPOSE_FILE" exec -T db sh -c "psql -h 127.0.0.1 -U $DB_USER -d $DB_NAME -v ON_ERROR_STOP=1 -f /dev/stdin" < "$SCHEMA_FILE"; then
            echo "✅ Schéma appliqué"
        else
            echo "❌ Échec application schéma"; exit 1
        fi
    else
        echo "⚠️  Fichier schéma introuvable ($SCHEMA_FILE)"
    fi
else
    echo "ℹ️  Schéma déjà appliqué"
fi

# 7. Attente Vault (interne réseau docker) - utiliser conteneur db (possède curl? sinon installer léger)
echo "⏳ Attente Vault..."
for i in {1..30}; do
    if $COMPOSE_CMD -f "$COMPOSE_FILE" exec -T db sh -c "which curl >/dev/null 2>&1 || (apk add --no-cache curl >/dev/null 2>&1 || apt-get update >/dev/null 2>&1 && apt-get install -y curl >/dev/null 2>&1); curl -s http://vault:8200/v1/sys/health >/dev/null 2>&1"; then
        echo "✅ Vault prêt"; break; fi; sleep 1; if [ "$i" = 30 ]; then echo "⚠️  Vault inaccessible (continuation)"; fi
done

# 8. Provision basique secrets (si moteur pas initialisé par code app)
echo "🔐 Vérification moteur KV + secrets essentiels"
VAULT_TOKEN_EFFECTIVE="${VAULT_TOKEN:-myroot}"
ensure_secret(){
    local path=$1
    local key=$2
    local value=$3
    if ! $COMPOSE_CMD -f "$COMPOSE_FILE" exec -T db sh -c "curl -s -H 'X-Vault-Token: $VAULT_TOKEN_EFFECTIVE' http://vault:8200/v1/secret/data/${path} >/dev/null 2>&1"; then
        $COMPOSE_CMD -f "$COMPOSE_FILE" exec -T db sh -c "curl -s -H 'X-Vault-Token: $VAULT_TOKEN_EFFECTIVE' -H 'Content-Type: application/json' -X POST http://vault:8200/v1/secret/data/${path} -d '{\"data\":{\"${key}\":\"${value}\"}}' >/dev/null 2>&1" && echo "  • Secret ${path} créé"
    else
        echo "  • Secret ${path} OK"
    fi
}
ensure_secret jwt secret "${JWT_SECRET:-dev_jwt_$(date +%s)}"
ensure_secret database_dummy placeholder "present"

# 9. Démarrer l'application (backend + nginx) - service 'app'
echo "🚀 Démarrage application (app)"
$COMPOSE_CMD -f "$COMPOSE_FILE" up -d app

# 10. Attente health backend (HTTPS 8443)
echo "⏳ Vérification backend HTTPS..."
for i in {1..40}; do
    if curl -k -s https://localhost:8443/api/health >/dev/null 2>&1; then echo "✅ Backend HTTPS OK"; break; fi; sleep 1; if [ "$i" = 40 ]; then echo "❌ Backend indisponible"; fi
done

echo ""; echo "📋 Récap services:";
echo "  🗄️  DB        : interne (port non exposé)"
echo "  🔐 Vault     : interne (utiliser exec pour tests)"
echo "  🌐 App HTTPS : https://localhost:8443"
echo "  🌐 App HTTP  : http://localhost:8080 (redirection)"
echo "  JWT secret   : stocké dans Vault (secret/jwt)"
echo "";
echo "🧪 Tests rapides:";
echo "  curl -k https://localhost:8443/api/health";
echo "  docker compose -f $COMPOSE_FILE exec db curl -s -H 'X-Vault-Token: ${VAULT_TOKEN_EFFECTIVE}' http://vault:8200/v1/secret/data/jwt | jq . 2>/dev/null || true";
echo "";
echo "🛑 Arrêt: $COMPOSE_CMD -f $COMPOSE_FILE down";
echo "🗑️  Reset complet: $COMPOSE_CMD -f $COMPOSE_FILE down -v";
echo "✅ Démarrage terminé";
