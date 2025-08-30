#!/bin/bash
# start-simple.sh - Script de démarrage simple sans initialisation Vault automatique

set -e  # Arrêter le script en cas d'erreur

echo "🚀 Démarrage simple de ft_transcendence..."
echo ""

# Fonction de nettoyage
cleanup() {
    echo ""
    echo "🧹 Nettoyage des conteneurs..."
    docker-compose down --remove-orphans 2>/dev/null || true
}

# Fonction d'arrêt propre
trap cleanup EXIT INT TERM

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé ou n'est pas dans le PATH"
    exit 1
fi

# Vérifier si docker-compose est installé
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose n'est pas installé ou n'est pas dans le PATH"
    exit 1
fi

# Vérifier si les certificats SSL existent
if [ ! -f "ssl/key.pem" ] || [ ! -f "ssl/cert.pem" ]; then
    echo "⚠️  Certificats SSL manquants. Génération automatique..."
    mkdir -p ssl
    openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/C=FR/ST=Paris/L=Paris/O=42/OU=ft_transcendence/CN=localhost"
    echo "✅ Certificats SSL générés"
fi

# Créer le fichier .env s'il n'existe pas
if [ ! -f ".env" ]; then
    echo "⚠️  Fichier .env manquant. Création avec valeurs par défaut..."
    cat > .env << EOF
# Configuration ft_transcendence
NODE_ENV=dev
HTTPS_PORT=5001

# Base de données
POSTGRES_VERSION=14
POSTGRES_USER=admin
POSTGRES_PASSWORD=test
POSTGRES_DB=db_transcendence

# Vault
VAULT_ADDR=http://localhost:8200
VAULT_TOKEN=myroot

# JWT
JWT_SECRET=your_super_secret_jwt_key_here

# OAuth 42
CLIENT_ID_42=your_42_client_id
CLIENT_SECRET_42=your_42_client_secret

# OAuth GitHub
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Email
MAIL_HOST=smtp.gmail.com
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password
EOF
    echo "✅ Fichier .env créé"
fi

echo ""
echo "🐳 Démarrage des services..."

# Démarrer tous les services
docker-compose up -d

echo ""
echo "⏳ Attente du démarrage des services..."

# Attendre que la base de données soit prête
echo "🗄️  Attente de PostgreSQL..."
max_attempts=30
attempt=1
while [ $attempt -le $max_attempts ]; do
    if docker-compose exec -T db pg_isready -U admin -d db_transcendence >/dev/null 2>&1; then
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

# Attendre que Vault soit prêt
echo "🔐 Attente de Vault..."
attempt=1
while [ $attempt -le $max_attempts ]; do
    if curl -s http://localhost:8200/v1/sys/health >/dev/null 2>&1; then
        echo "✅ Vault est prêt !"
        break
    fi
    echo "⏳ Tentative $attempt/$max_attempts - Vault pas encore prêt..."
    sleep 2
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    echo "❌ Timeout: Vault n'est pas prêt après $max_attempts tentatives"
    exit 1
fi

# Attendre que le backend soit prêt
echo "🖥️  Attente du backend..."
attempt=1
while [ $attempt -le $max_attempts ]; do
    if curl -k -s https://localhost:5001/healthcheck >/dev/null 2>&1; then
        echo "✅ Backend est prêt !"
        break
    fi
    echo "⏳ Tentative $attempt/$max_attempts - Backend pas encore prêt..."
    sleep 2
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    echo "❌ Timeout: Backend n'est pas prêt après $max_attempts tentatives"
    exit 1
fi

echo ""
echo "🎉 Démarrage terminé avec succès !"
echo ""
echo "📊 Services disponibles :"
echo "  🌐 Frontend  : https://localhost:5173"
echo "  🖥️  Backend  : https://localhost:5001"
echo "  🔐 Vault     : http://localhost:8200 (Token: myroot)"
echo "  🗄️  Adminer  : http://localhost:8080"
echo "  🗄️  PostgreSQL : localhost:5434"
echo ""
echo "🔧 Pour configurer les secrets Vault :"
echo "  ./scripts/setup-vault-secrets.sh"
echo ""
echo "🧪 Pour tester l'application :"
echo "  ./test-ft-transcendence.sh"
echo ""
echo "🛑 Pour arrêter :"
echo "  docker-compose down"
