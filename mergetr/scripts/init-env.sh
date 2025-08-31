if [ ! -f ".env" ]; then
    cat > .env << EOF
NODE_ENV=dev
HTTPS_PORT=5001

# Base de données
POSTGRES_VERSION=14
POSTGRES_USER=admin
POSTGRES_PASSWORD=test
POSTGRES_DB=db_transcendence
POSTGRES_HOST=db
POSTGRES_PORT=5432

# Vault
VAULT_ADDR=http://vault:8200
VAULT_TOKEN=myroot

# JWT
JWT_SECRET=your_super_secret_jwt_key_here

# Security
SALT_ROUNDS=12

# OAuth 42
CLIENT_ID_42=your_42_client_id
CLIENT_SECRET_42=your_42_client_secret

# OAuth GitHub
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
CLIENT_ID_GITHUB=your_github_client_id
CLIENT_SECRET_GITHUB=your_github_client_secret

# OAuth Google
CLIENT_ID_GOOGLE=your_google_client_id
CLIENT_SECRET_GOOGLE=your_google_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Email
MAIL_HOST=smtp.gmail.com
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
EOF
fi
sleep 1
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
      VAULT_DEV_ROOT_TOKEN_ID: ${VAULT_TOKEN}
      VAULT_DEV_LISTEN_ADDRESS: 0.0.0.0:8200
      VAULT_ADDR: http://localhost:8200
    ports:
      - "8200:8200"
    volumes:
      - ./scripts/init-vault.sh:/init-vault.sh
    command: vault server -dev -dev-root-token-id=${VAULT_TOKEN}
    healthcheck:
      test: ["CMD", "vault", "status"]
      interval: 10s
      timeout: 5s
      retries: 5

  db:
    image: postgres:${POSTGRES_VERSION}
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "5434:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./backend/database/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
      - ./backend/src/db/gdpr-schema.sql:/docker-entrypoint-initdb.d/02-gdpr-schema.sql

  # Service d'initialisation automatique de Vault
  vault-init:
    image: hashicorp/vault:1.15
    depends_on:
      vault:
        condition: service_healthy
    environment:
      VAULT_ADDR: http://vault:8200
      VAULT_TOKEN: ${VAULT_TOKEN}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_HOST: ${POSTGRES_HOST}
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_PORT: ${POSTGRES_PORT}
      JWT_SECRET: ${JWT_SECRET}
      SMTP_HOST: ${SMTP_HOST}
      SMTP_PORT: ${SMTP_PORT}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASSWORD: ${SMTP_PASSWORD}
      CLIENT_ID_42: ${CLIENT_ID_42}
      CLIENT_SECRET_42: ${CLIENT_SECRET_42}
      CLIENT_ID_GITHUB: ${CLIENT_ID_GITHUB}
      CLIENT_SECRET_GITHUB: ${CLIENT_SECRET_GITHUB}
      CLIENT_ID_GOOGLE: ${CLIENT_ID_GOOGLE}
      CLIENT_SECRET_GOOGLE: ${CLIENT_SECRET_GOOGLE}
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
    image: postgres:${POSTGRES_VERSION}
    depends_on:
      db:
        condition: service_started
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
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
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/src/db/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    networks:
      - app_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
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
      VAULT_DEV_ROOT_TOKEN_ID: ${VAULT_TOKEN}
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
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
      VAULT_ADDR: http://localhost:8200
      VAULT_TOKEN: ${VAULT_TOKEN}
      JWT_SECRET: ${JWT_SECRET}
      
      # OAuth Configuration (via Vault en production)
      CLIENT_ID_42: ${CLIENT_ID_42}
      CLIENT_SECRET_42: ${CLIENT_SECRET_42}
      REDIRECT_URI: https://localhost/auth/42/callback
      
      GITHUB_CLIENT_ID: ${GITHUB_CLIENT_ID}
      GITHUB_CLIENT_SECRET: ${GITHUB_CLIENT_SECRET}
      GITHUB_REDIRECT_URI: https://localhost/auth/github/callback
      
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
      GOOGLE_REDIRECT_URI: https://localhost/auth/google/callback
      
      # Email Configuration
      MAIL_HOST: ${MAIL_HOST}
      MAIL_USER: ${MAIL_USER}
      MAIL_PASS: ${MAIL_PASS}
      
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
