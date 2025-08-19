#!/bin/bash
# Script pour exécuter les tests depuis Docker - ft_transcendence
# Usage: ./docker-test-stats.sh

set -e

echo "🐳 Tests StatsService via Docker - ft_transcendence"
echo "================================================="

# Vérifier que Docker Compose est disponible
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé"
    exit 1
fi

# Vérifier que les services sont démarrés
echo "📋 Vérification des services Docker..."
if ! docker-compose ps | grep -q "Up"; then
    echo "🚀 Démarrage des services Docker..."
    docker-compose up -d
    echo "⏳ Attente du démarrage complet (30 secondes)..."
    sleep 30
else
    echo "✅ Services Docker déjà démarrés"
fi

# Afficher l'état des services
echo "📊 État des services:"
docker-compose ps

# Attendre que la base de données soit prête
echo "⏳ Attente de la base de données..."
docker-compose exec -T db pg_isready -U admin -d db_transcendence || {
    echo "⏳ Base de données pas encore prête, attente supplémentaire..."
    sleep 10
}

# Vérifier les logs du serveur Node.js
echo "📜 Derniers logs du serveur:"
docker-compose logs --tail=10 node

# Exécuter les tests depuis le conteneur node
echo "🧪 Exécution des tests..."
docker-compose exec -T node bash -c "
    cd /home/node/app/backend/tests
    
    # Installer curl si nécessaire (dans le conteneur)
    apt-get update -qq && apt-get install -y -qq curl jq
    
    # Exécuter le script de test
    chmod +x test-stats.sh
    ./test-stats.sh
"

# Optionnel: Exécuter des tests SQL directement
echo "🗄️  Test direct de la base de données..."
docker-compose exec -T db psql -U admin -d db_transcendence -c "
    SELECT 'Test DB Connection' as status;
    SELECT COUNT(*) as user_count FROM users;
    SELECT COUNT(*) as stats_count FROM stats;
"

echo "✅ Tests terminés!"
echo "================================================="
