#!/bin/bash
# start-simple.sh - Script de démarrage ultra-simple

set -e

echo "🚀 Démarrage de ft_transcendence..."
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

# Créer le .env si nécessaire
if [ ! -f ".env" ]; then
    echo "📝 Création du fichier .env..."
    cat > .env << 'EOF'
# Configuration ft_transcendence
NODE_ENV=dev
HTTPS_PORT=5001

# Base de données
POSTGRES_VERSION=14
POSTGRES_USER=admin
POSTGRES_PASSWORD=test
POSTGRES_DB=db_transcendence

# Vault
VAULT_ADDR=http://vault:8200
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

# Démarrer les services
echo "🐳 Démarrage des services..."
$COMPOSE_CMD up -d

echo ""
echo "⏳ Attente du démarrage..."
sleep 10

# Vérifier que les services sont prêts
if curl -k -s https://localhost:5001/healthz &>/dev/null; then
    echo "✅ Backend prêt"
else
    echo "⚠️  Backend pas encore prêt (continuer quand même)"
fi

# Ouvrir Adminer automatiquement ?
if [ "$1" = "--open-adminer" ]; then
    sleep 2
    open_adminer
fi

echo ""
echo "🎉 Démarrage terminé !"
echo ""
echo "📊 Services disponibles :"
echo "  🌐 Frontend  : https://localhost:5173"
echo "  🖥️  Backend  : https://localhost:5001"
echo "  🔐 Vault     : http://localhost:8200 (Token: myroot)"
echo "  🗄️  PostgreSQL : localhost:5434"
echo "  🗃️  Adminer   : http://localhost:8080 (admin/test) - ./open-adminer.sh"
echo ""
echo "🛑 Pour arrêter : $COMPOSE_CMD down"

# Fonction pour ouvrir Adminer
open_adminer() {
    echo "🗃️ Ouverture d'Adminer..."
    if command -v xdg-open &> /dev/null; then
        xdg-open "http://localhost:8080/?pgsql=db&username=admin&db=db_transcendence"
    elif command -v open &> /dev/null; then
        open "http://localhost:8080/?pgsql=db&username=admin&db=db_transcendence"
    else
        echo "🔗 Lien Adminer: http://localhost:8080/?pgsql=db&username=admin&db=db_transcendence"
    fi
}
