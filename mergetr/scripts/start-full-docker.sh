#!/bin/bash

# Script de lancement complet de l'environnement de développement ft_transcendence
# Ce script lance tous les services via Docker Compose

set -e

echo "🚀 Lancement de l'environnement de développement complet ft_transcendence"
echo "============================================================================"

# Vérifier que Docker et Docker Compose sont installés
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null 2>&1; then
    echo "❌ Docker Compose n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
fi

# Vérifier la présence du fichier .env
if [ ! -f .env ]; then
    echo "⚠️  Fichier .env non trouvé. Création d'un fichier .env basé sur .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Fichier .env créé. Veuillez le configurer si nécessaire."
    else
        echo "❌ Fichier .env.example non trouvé. Impossible de créer le fichier .env."
        exit 1
    fi
fi

# Validation de l'environnement
echo "🔍 Validation de l'environnement..."
if [ -f scripts/validate-env.js ]; then
    node scripts/validate-env.js
    if [ $? -ne 0 ]; then
        echo "❌ Validation de l'environnement échouée. Veuillez corriger les erreurs."
        exit 1
    fi
else
    echo "⚠️  Script de validation de l'environnement non trouvé. Continuation..."
fi

# Nettoyer les anciens containers si nécessaire
echo "🧹 Nettoyage des anciens containers..."
docker-compose -f docker-compose.full.yml down --remove-orphans

# Construire et lancer tous les services
echo "🔨 Construction et lancement des services..."
docker-compose -f docker-compose.full.yml up --build -d

# Attendre que les services soient prêts
echo "⏳ Attente du démarrage des services..."
sleep 5

# Vérifier l'état des services
echo "🔍 Vérification de l'état des services..."
docker-compose -f docker-compose.full.yml ps

# Vérifier la santé des services critiques
echo "🏥 Vérification de la santé des services..."

# Attendre que la base de données soit prête
echo "  📊 Vérification de la base de données..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if docker-compose -f docker-compose.full.yml exec -T db pg_isready -U admin -d db_transcendence > /dev/null 2>&1; then
        echo "  ✅ Base de données prête"
        break
    fi
    attempt=$((attempt + 1))
    echo "  ⏳ Attente de la base de données... ($attempt/$max_attempts)"
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo "  ❌ La base de données n'est pas prête après $max_attempts tentatives"
    exit 1
fi

# Vérifier le backend
echo "  🔧 Vérification du backend..."
max_attempts=20
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if curl -f http://localhost:5001/api/health > /dev/null 2>&1; then
        echo "  ✅ Backend prêt"
        break
    fi
    attempt=$((attempt + 1))
    echo "  ⏳ Attente du backend... ($attempt/$max_attempts)"
    sleep 3
done

if [ $attempt -eq $max_attempts ]; then
    echo "  ⚠️  Le backend n'est pas encore prêt, mais continuons..."
fi

# Vérifier le frontend
echo "  🎨 Vérification du frontend..."
max_attempts=20
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if curl -f http://localhost:5173 > /dev/null 2>&1; then
        echo "  ✅ Frontend prêt"
        break
    fi
    attempt=$((attempt + 1))
    echo "  ⏳ Attente du frontend... ($attempt/$max_attempts)"
    sleep 3
done

if [ $attempt -eq $max_attempts ]; then
    echo "  ⚠️  Le frontend n'est pas encore prêt, mais continuons..."
fi

echo ""
echo "🎉 Environnement de développement lancé avec succès !"
echo "============================================================================"
echo "📱 Services disponibles :"
echo "  🎨 Frontend (React/Vite) : http://localhost:5173"
echo "  🔧 Backend (Node.js/Fastify) : http://localhost:5001"
echo "  📊 Base de données (PostgreSQL) : localhost:5433"
echo "  🛠️  Adminer (DB Admin) : http://localhost:8080"
echo "  🔐 Vault (Secrets) : http://localhost:8200"
echo ""
echo "📝 Commandes utiles :"
echo "  📋 Voir les logs : docker-compose -f docker-compose.full.yml logs -f"
echo "  🔄 Redémarrer un service : docker-compose -f docker-compose.full.yml restart <service>"
echo "  🛑 Arrêter tous les services : docker-compose -f docker-compose.full.yml down"
echo ""
echo "🔍 Pour voir les logs en temps réel :"
echo "docker-compose -f docker-compose.full.yml logs -f"
