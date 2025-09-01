#!/bin/bash

# Script de diagnostic pour les problèmes de base de données
# Usage: ./scripts/diagnose-db.sh

echo "🔍 Diagnostic de la base de données ft_transcendence"
echo "=================================================="

# Vérifier si Docker Compose est en cours d'exécution
echo ""
echo "1. Vérification des services Docker..."
if docker-compose ps | grep -q "Up"; then
    echo "✅ Services Docker actifs:"
    docker-compose ps
else
    echo "❌ Aucun service Docker actif"
fi

# Tester la connexion à la base de données
echo ""
echo "2. Test de connexion à la base de données..."
if curl -k -s https://localhost:5001/healthz/database > /dev/null 2>&1; then
    echo "✅ API de santé de la DB accessible"
    DB_HEALTH=$(curl -k -s https://localhost:5001/healthz/database)
    echo "   Détails: $DB_HEALTH"
else
    echo "❌ API de santé de la DB inaccessible"
fi

# Vérifier la configuration Vault
echo ""
echo "3. Vérification de la configuration Vault..."
if curl -k -s https://localhost:5001/api/vault/secret/database > /dev/null 2>&1; then
    echo "✅ Configuration Vault accessible"
    VAULT_CONFIG=$(curl -k -s https://localhost:5001/api/vault/secret/database)
    echo "   Configuration DB: $VAULT_CONFIG"
else
    echo "❌ Configuration Vault inaccessible"
fi

# Vérifier les variables d'environnement
echo ""
echo "4. Vérification des variables d'environnement..."
if [ -f ".env" ]; then
    echo "✅ Fichier .env trouvé"
    grep -E "POSTGRES_|DB_" .env | sed 's/=.*/=***/' # Masquer les mots de passe
else
    echo "❌ Fichier .env non trouvé"
fi

# Vérifier les logs récents
echo ""
echo "5. Logs récents du backend..."
if docker logs mergetr-node-1 --tail 10 2>/dev/null | grep -q "Database\|Vault\|ECONNREFUSED"; then
    echo "⚠️  Problèmes détectés dans les logs:"
    docker logs mergetr-node-1 --tail 20 2>/dev/null | grep -E "Database\|Vault\|ECONNREFUSED\|✅\|❌\|Error"
else
    echo "✅ Aucun problème apparent dans les logs récents"
fi

# Recommandations
echo ""
echo "6. Recommandations:"
echo "   - Si la DB ne répond pas: docker-compose restart db"
echo "   - Si Vault ne fonctionne pas: docker-compose restart vault"
echo "   - Si l'API ne répond pas: docker-compose restart node"
echo "   - Pour réinitialiser Vault: curl -k -X POST https://localhost:5001/api/vault/init-dev-secrets"
echo "   - Pour tester la DB: curl -k https://localhost:5001/healthz/database"

echo ""
echo "=================================================="
echo "🔍 Diagnostic terminé"
