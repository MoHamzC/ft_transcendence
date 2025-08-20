#!/bin/bash

# Script de vérification rapide du setup des tournois
# Teste que toutes les routes et la DB sont opérationnelles

echo "🔍 Vérification du setup des tournois..."

BASE_URL="http://localhost:5001/api"

# Test 1: Vérifier que l'API répond
echo "1. Test de santé de l'API..."
response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/tournaments")
if [ "$response" = "200" ]; then
    echo "✅ API accessible"
else
    echo "❌ API inaccessible (code: $response)"
    exit 1
fi

# Test 2: Créer un tournoi de test
echo "2. Test de création de tournoi..."
tournament_response=$(curl -s -X POST "$BASE_URL/tournaments" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Test Setup",
        "description": "Vérification du setup",
        "maxPlayers": 4,
        "type": "elimination"
    }')

if echo "$tournament_response" | grep -q '"tournament"'; then
    echo "✅ Création de tournoi réussie"
    
    # Extraire l'ID du tournoi
    tournament_id=$(echo "$tournament_response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo "   ID du tournoi: $tournament_id"
    
    # Test 3: Inscrire un joueur
    echo "3. Test d'inscription de joueur..."
    register_response=$(curl -s -X POST "$BASE_URL/tournaments/$tournament_id/register" \
        -H "Content-Type: application/json" \
        -d '{"alias": "TestPlayer"}')
    
    if echo "$register_response" | grep -q '"participant"'; then
        echo "✅ Inscription de joueur réussie"
    else
        echo "❌ Inscription de joueur échouée"
        echo "   Réponse: $register_response"
    fi
    
    # Test 4: Récupérer les détails
    echo "4. Test de récupération des détails..."
    details_response=$(curl -s "$BASE_URL/tournaments/$tournament_id")
    
    if echo "$details_response" | grep -q '"tournament"'; then
        echo "✅ Récupération des détails réussie"
    else
        echo "❌ Récupération des détails échouée"
    fi
    
else
    echo "❌ Création de tournoi échouée"
    echo "   Réponse: $tournament_response"
    exit 1
fi

echo ""
echo "🎉 Vérification terminée avec succès !"
echo "   Le système de tournois est opérationnel."
echo ""
echo "📋 Pour tester complètement:"
echo "   - Ouvre backend/tests/tournament.http dans VS Code"
echo "   - Utilise l'extension REST Client"
echo "   - Exécute les requêtes une par une"
