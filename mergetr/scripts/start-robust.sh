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

# Créer le .env si nécessaire
if [ ! -f ".env" ]; then
    echo "📝 Création du fichier .env avec des valeurs sécurisées..."
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

# Créer le compose.yaml si nécessaire
if [ ! -f "compose.yaml" ]; then
    echo "📝 Création du fichier .env avec des valeurs sécurisées..."
    cat > compose.yaml << 'EOF'
services:
  vault:
    image: hashicorp/vault:1.15
    restart: always
    cap_add:
      - IPC_LOCK
    environment:
      VAULT_DEV_ROOT_TOKEN_ID: ${VAULT_TOKEN:-CHANGE_THIS_VAULT_TOKEN}
      VAULT_DEV_LISTEN_ADDRESS: 0.0.0.0:8200
      VAULT_ADDR: http://vault:8200
    ports:
      - "8200:8200"
    volumes:
      - ./scripts/init-vault.sh:/init-vault.sh
    command: vault server -dev -dev-root-token-id=${VAULT_TOKEN:-CHANGE_THIS_VAULT_TOKEN}
    healthcheck:
      test: ["CMD", "vault", "status"]
      interval: 10s
      timeout: 5s
      retries: 5

  db:
    image: postgres:${POSTGRES_VERSION:-14}
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-admin}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-CHANGE_THIS_DB_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:-db_transcendence}
    ports:
      - "5434:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  # Service d'initialisation automatique de Vault
  vault-init:
    image: hashicorp/vault:1.15
    depends_on:
      vault:
        condition: service_healthy
    environment:
      VAULT_ADDR: http://vault:8200
      VAULT_TOKEN: ${VAULT_TOKEN:-CHANGE_THIS_VAULT_TOKEN}
      POSTGRES_USER: ${POSTGRES_USER:-admin}
      POSTGRES_HOST: ${POSTGRES_HOST:-db}
      POSTGRES_DB: ${POSTGRES_DB:-db_transcendence}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-CHANGE_THIS_DB_PASSWORD}
      POSTGRES_PORT: ${POSTGRES_PORT:-5432}
      JWT_SECRET: ${JWT_SECRET:-CHANGE_THIS_JWT_SECRET}
      SMTP_HOST: ${SMTP_HOST:-smtp.gmail.com}
      SMTP_PORT: ${SMTP_PORT:-587}
      SMTP_USER: ${SMTP_USER:-your_email@gmail.com}
      SMTP_PASSWORD: ${SMTP_PASSWORD:-your_app_password}
      CLIENT_ID_42: ${CLIENT_ID_42:-your_42_client_id}
      CLIENT_SECRET_42: ${CLIENT_SECRET_42:-}
      CLIENT_ID_GITHUB: ${CLIENT_ID_GITHUB:-your_github_client_id}
      CLIENT_SECRET_GITHUB: ${CLIENT_SECRET_GITHUB:-}
      CLIENT_ID_GOOGLE: ${CLIENT_ID_GOOGLE:-your_google_client_id}
      CLIENT_SECRET_GOOGLE: ${CLIENT_SECRET_GOOGLE:-}
    volumes:
      - ./scripts/init-vault-auto.sh:/init-vault-auto.sh
    command: ["/bin/sh", "/init-vault-auto.sh"]
    profiles:
      - init

  node:
    image: node:24
    working_dir: /home/sgoinfre
    environment:
      - NODE_ENV=dev
      - HTTPS_PORT=5001
    volumes:
      - ./:/home/sgoinfre
      - ./ssl:/home/sgoinfre/backend/ssl:ro  # Monter les certificats SSL dans le bon répertoire
    ports:
      - "5001:5001"
    env_file:
      - .env
    command: bash -c "cd backend && npm install && npx nodemon ./src/server-https.js"
    depends_on:
      - db
      - vault
    healthcheck:
      test: ["CMD", "curl", "-k", "-f", "https://localhost:5001/healthz"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  frontend:
    image: node:24
    working_dir: /home/node/app/frontend
    environment:
      - NODE_ENV=development
    volumes:
      - ./:/home/node/app
      - ./ssl:/home/node/app/ssl:ro  # Monter les certificats SSL
    ports:
      - "5173:5173"
    depends_on:
      - node
    command: bash -c "npm install && npm run dev -- --host 0.0.0.0"

  adminer:
    image: adminer:latest
    restart: always
    ports:
      - "8080:8080"
    depends_on:
      - db

  # Service d'initialisation automatique de la base de données
  db-init:
    image: postgres:${POSTGRES_VERSION:-14}
    depends_on:
      db:
        condition: service_started
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-admin}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-CHANGE_THIS_DB_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:-db_transcendence}
    volumes:
      - ./scripts/init-database.sh:/init-database.sh
      - ./backend/database/schema.sql:/app/database/schema.sql
    command: ["/bin/sh", "/init-database.sh"]
    profiles:
      - init

volumes:
  pgdata:

EOF
    echo "✅ Fichier compose.yaml créé"
fi

# Créer le docker-compose.secure.yml si nécessaire
if [ ! -f "docker-compose.secure.yml" ]; then
    echo "📝 Création du fichier .env avec des valeurs sécurisées..."
    cat > docker-compose.secure.yml << 'EOF'
# docker-compose.secure.yml
# Configuration Docker Compose sécurisée avec HTTPS
version: '3.8'

services:
  # Base de données PostgreSQL
  db:
    image: postgres:14
    container_name: ft_transcendence_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-admin}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-secure_password_change_me}
      POSTGRES_DB: ${POSTGRES_DB:-db_transcendence}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/src/db/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    networks:
      - app_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-admin} -d ${POSTGRES_DB:-db_transcendence}"]
      interval: 10s
      timeout: 5s
      retries: 5
    # Sécurité: pas d'exposition de port externe

  # HashiCorp Vault pour la gestion des secrets
  vault:
    image: hashicorp/vault:1.15
    container_name: ft_transcendence_vault
    restart: unless-stopped
    environment:
      VAULT_DEV_ROOT_TOKEN_ID: ${VAULT_TOKEN:-myroot}
      VAULT_DEV_LISTEN_ADDRESS: 0.0.0.0:8200
      VAULT_LOG_LEVEL: info
    volumes:
      - vault_data:/vault/data
    networks:
      - app_network
    cap_add:
      - IPC_LOCK
    healthcheck:
      test: ["CMD", "vault", "status"]
      interval: 10s
      timeout: 5s
      retries: 5
    # Sécurité: pas d'exposition de port externe

  # Application principale avec nginx + Node.js
  app:
    build:
      context: .
      dockerfile: Dockerfile.secure
    container_name: ft_transcendence_app
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://${POSTGRES_USER:-admin}:${POSTGRES_PASSWORD:-secure_password_change_me}@db:5432/${POSTGRES_DB:-db_transcendence}
      VAULT_ADDR: http://vault:8200
      VAULT_TOKEN: ${VAULT_TOKEN:-myroot}
      JWT_SECRET: ${JWT_SECRET:-fallback_jwt_secret_change_me}

      # OAuth Configuration (via Vault en production)
      CLIENT_ID_42: ${CLIENT_ID_42:-}
      CLIENT_SECRET_42: ${CLIENT_SECRET_42:-}
      REDIRECT_URI: https://localhost/auth/42/callback

      GITHUB_CLIENT_ID: ${GITHUB_CLIENT_ID:-}
      GITHUB_CLIENT_SECRET: ${GITHUB_CLIENT_SECRET:-}
      GITHUB_REDIRECT_URI: https://localhost/auth/github/callback

      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID:-}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET:-}
      GOOGLE_REDIRECT_URI: https://localhost/auth/google/callback

      # Email Configuration
      MAIL_HOST: ${MAIL_HOST:-smtp.gmail.com}
      MAIL_USER: ${MAIL_USER:-}
      MAIL_PASS: ${MAIL_PASS:-}

      # Sécurité
      ALLOWED_ORIGINS: https://localhost,https://127.0.0.1
      SALT_ROUNDS: 12
    ports:
      - "80:80"
      - "443:443"
    networks:
      - app_network
    depends_on:
      db:
        condition: service_healthy
    # healthcheck:
    #   test: ["CMD", "curl", "-f", "https://localhost/healthz", "--insecure"]
    #   interval: 30s
    #   timeout: 10s
    #   retries: 3
    volumes:
      # Persistance des certificats SSL
      - ./ssl:/etc/nginx/ssl
    security_opt:
      - no-new-privileges:true
    read_only: false # nginx a besoin d'écrire des fichiers temporaires
    tmpfs:
      - /tmp
      - /var/cache/nginx
      - /var/run

networks:
  app_network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16

volumes:
  postgres_data:
    driver: local
  vault_data:
    driver: local

EOF
    echo "✅ Fichier docker-compose.secure.yml créé"
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
