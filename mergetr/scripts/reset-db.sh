#!/bin/bash

# Script de réinitialisation complète de la base de données
# ATTENTION: Cela va supprimer toutes les données!
# Usage: ./scripts/reset-db.sh

echo "⚠️  ATTENTION: Ce script va supprimer TOUTES les données de la base!"
read -p "Êtes-vous sûr de vouloir continuer? (tapez 'YES' pour confirmer): " confirm

if [ "$confirm" != "YES" ]; then
    echo "❌ Opération annulée"
    exit 1
fi

echo "🔄 Réinitialisation complète de la base de données..."
echo "=================================================="

# Arrêter les services
echo "1. Arrêt des services..."
docker-compose down

# Supprimer les volumes de données
echo "2. Suppression des volumes de données..."
docker volume rm $(docker volume ls -q | grep mergetr) 2>/dev/null || true

# Nettoyer les conteneurs
echo "3. Nettoyage des conteneurs..."
docker-compose rm -f

# Redémarrer tout
echo "4. Redémarrage des services..."
docker-compose up -d

# Attendre que la DB soit prête
echo "5. Attente de l'initialisation de la base de données..."
sleep 10

# Vérifier que tout fonctionne
echo "6. Vérification des services..."
docker-compose ps

echo ""
echo "✅ Réinitialisation terminée!"
echo "💡 Vous pouvez maintenant tester avec:"
echo "   curl -k https://localhost:5001/healthz/database"
echo "   curl -k -X POST https://localhost:5001/api/vault/init-dev-secrets"
