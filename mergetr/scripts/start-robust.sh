#!/bin/bash
# start-robust.sh - Script de démarrage robuste avec initialisation automatique

set -e

echo "🚀 Démarrage robuste de ft_transcendence..."
echo ""

# Vérifications de base
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    exit 1
fi

# Détecter la commande compose
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    echo "❌ Docker Compose n'est pas disponible"
    exit 1
fi

# Créer les certificats SSL si nécessaire
if [ ! -f "ssl/key.pem" ] || [ ! -f "ssl/cert.pem" ]; then
    echo "🔐 Génération des certificats SSL..."
    mkdir -p ssl
    openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/C=FR/ST=Paris/L=Paris/O=42/OU=ft_transcendence/CN=localhost" &>/dev/null
    echo "✅ Certificats SSL générés"
fi

echo "🔧 Initialisation automatique des services..."

# Démarrer PostgreSQL et Vault d'abord
echo "🐳 Démarrage des services de base..."
$COMPOSE_CMD up -d db vault

# Attendre que PostgreSQL soit prêt
echo "⏳ Attente de PostgreSQL..."
sleep 10

# Initialisation manuelle de la base de données
echo "📊 Initialisation de la base de données..."
if ! docker compose exec -T db psql -U admin -d db_transcendence -c "SELECT 1 FROM users LIMIT 1;" >/dev/null 2>&1; then
    echo "📝 Copie et application du schéma..."
    docker cp backend/database/schema.sql mergetr-db-1:/var/lib/postgresql/schema.sql
    docker compose exec -T db psql -U admin -d db_transcendence -f /var/lib/postgresql/schema.sql
    echo "✅ Schéma appliqué"
else
    echo "ℹ️  Base déjà initialisée"
fi

# Attendre que Vault soit prêt
echo "⏳ Attente de Vault..."
sleep 5

# Initialisation manuelle de Vault
echo "🔐 Initialisation de Vault..."
export VAULT_ADDR="http://localhost:8200"
export VAULT_TOKEN="myroot"

# Attendre que Vault réponde
max_attempts=30
attempt=1
while [ $attempt -le $max_attempts ]; do
    if curl -s "$VAULT_ADDR/v1/sys/health" >/dev/null 2>&1; then
        echo "✅ Vault prêt"
        break
    fi
    echo "⏳ Attente Vault ($attempt/$max_attempts)..."
    sleep 2
    attempt=$((attempt + 1))
done

# Configurer les secrets Vault
vault secrets enable -version=2 -path=secret kv 2>/dev/null || echo "ℹ️  Moteur déjà activé"
vault kv put secret/database user="${POSTGRES_USER}" host="${POSTGRES_HOST}" database="${POSTGRES_DB}" password="${POSTGRES_PASSWORD}" port="${POSTGRES_PORT}" 2>/dev/null || echo "ℹ️  Secret database existe"
vault kv put secret/jwt secret="${JWT_SECRET}" 2>/dev/null || echo "ℹ️  Secret JWT existe"
echo "✅ Secrets Vault configurés"

echo "🐳 Démarrage des services restants..."
$COMPOSE_CMD up -d node frontend adminer

echo "⏳ Attente du démarrage complet..."
sleep 10

# Vérifier que tout fonctionne
echo "🔍 Vérification des services..."

# Test de santé du backend
if curl -k https://localhost:5001/healthz >/dev/null 2>&1; then
    echo "✅ Backend : OK"
else
    echo "❌ Backend : ÉCHEC"
fi

# Test de santé de Vault
if curl -s http://localhost:8200/v1/sys/health >/dev/null 2>&1; then
    echo "✅ Vault : OK"
else
    echo "❌ Vault : ÉCHEC"
fi

echo ""
echo "🎉 Démarrage terminé !"
echo ""
echo "📊 Services disponibles :"
echo "  🌐 Frontend  : https://localhost:5173"
echo "  🖥️  Backend  : https://localhost:5001"
echo "  🔐 Vault     : http://localhost:8200 (Token: myroot)"
echo "  🗄️  PostgreSQL : localhost:5434"
echo "  🗃️  Adminer   : http://localhost:8080"
echo ""
echo "🛑 Pour arrêter : $COMPOSE_CMD down"
echo "🗑️  Pour tout nettoyer : $COMPOSE_CMD down -v"
