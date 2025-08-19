#!/bin/bash

# test-tournament.sh
# Script de test automatisé pour le système de tournois

BASE_URL="http://localhost:3000"
TOURNAMENT_ID=""
MATCH_ID=""

echo "🎾 Tests du système de tournois"
echo "================================"

# Fonction pour afficher les résultats
function check_response() {
    if [ $1 -eq 0 ]; then
        echo "✅ $2"
    else
        echo "❌ $2"
        exit 1
    fi
}

# 1. Créer un tournoi
echo "1. Création d'un tournoi..."
RESPONSE=$(curl -s -X POST "$BASE_URL/tournaments" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Tournoi Test Auto",
        "description": "Tournoi créé automatiquement",
        "maxPlayers": 4,
        "type": "elimination"
    }')

TOURNAMENT_ID=$(echo $RESPONSE | jq -r '.tournament.id')
check_response $? "Tournoi créé avec ID: $TOURNAMENT_ID"

# 2. Inscrire des joueurs
echo "2. Inscription des joueurs..."

for i in {1..4}; do
    curl -s -X POST "$BASE_URL/tournaments/$TOURNAMENT_ID/register" \
        -H "Content-Type: application/json" \
        -d "{\"alias\": \"Joueur$i\"}" > /dev/null
    check_response $? "Joueur$i inscrit"
done

# 3. Démarrer le tournoi
echo "3. Démarrage du tournoi..."
curl -s -X POST "$BASE_URL/tournaments/$TOURNAMENT_ID/start" > /dev/null
check_response $? "Tournoi démarré"

# 4. Récupérer le prochain match
echo "4. Récupération du prochain match..."
MATCH_RESPONSE=$(curl -s "$BASE_URL/tournaments/$TOURNAMENT_ID/next-match")
MATCH_ID=$(echo $MATCH_RESPONSE | jq -r '.match.id')
PLAYER1_ID=$(echo $MATCH_RESPONSE | jq -r '.match.player1_id')
PLAYER2_ID=$(echo $MATCH_RESPONSE | jq -r '.match.player2_id')

check_response $? "Prochain match récupéré: $MATCH_ID"

# 5. Jouer le premier match
echo "5. Enregistrement du résultat du premier match..."
curl -s -X POST "$BASE_URL/matches/$MATCH_ID/result" \
    -H "Content-Type: application/json" \
    -d "{
        \"winnerId\": \"$PLAYER1_ID\",
        \"player1Score\": 11,
        \"player2Score\": 9
    }" > /dev/null
check_response $? "Résultat du premier match enregistré"

# 6. Récupérer le deuxième match
echo "6. Récupération du deuxième match..."
MATCH_RESPONSE=$(curl -s "$BASE_URL/tournaments/$TOURNAMENT_ID/next-match")
MATCH_ID=$(echo $MATCH_RESPONSE | jq -r '.match.id')
PLAYER1_ID=$(echo $MATCH_RESPONSE | jq -r '.match.player1_id')

check_response $? "Deuxième match récupéré: $MATCH_ID"

# 7. Jouer le deuxième match
echo "7. Enregistrement du résultat du deuxième match..."
curl -s -X POST "$BASE_URL/matches/$MATCH_ID/result" \
    -H "Content-Type: application/json" \
    -d "{
        \"winnerId\": \"$PLAYER1_ID\",
        \"player1Score\": 11,
        \"player2Score\": 7
    }" > /dev/null
check_response $? "Résultat du deuxième match enregistré"

# 8. Récupérer la finale
echo "8. Récupération de la finale..."
MATCH_RESPONSE=$(curl -s "$BASE_URL/tournaments/$TOURNAMENT_ID/next-match")
MATCH_ID=$(echo $MATCH_RESPONSE | jq -r '.match.id')
PLAYER1_ID=$(echo $MATCH_RESPONSE | jq -r '.match.player1_id')

check_response $? "Finale récupérée: $MATCH_ID"

# 9. Jouer la finale
echo "9. Enregistrement du résultat de la finale..."
curl -s -X POST "$BASE_URL/matches/$MATCH_ID/result" \
    -H "Content-Type: application/json" \
    -d "{
        \"winnerId\": \"$PLAYER1_ID\",
        \"player1Score\": 11,
        \"player2Score\": 5
    }" > /dev/null
check_response $? "Résultat de la finale enregistré"

# 10. Vérifier l'état final du tournoi
echo "10. Vérification de l'état final..."
FINAL_STATE=$(curl -s "$BASE_URL/tournaments/$TOURNAMENT_ID")
STATUS=$(echo $FINAL_STATE | jq -r '.tournament.status')

if [ "$STATUS" = "finished" ]; then
    echo "✅ Tournoi terminé avec succès"
    WINNER=$(echo $FINAL_STATE | jq -r '.tournament.winner_id')
    echo "🏆 Gagnant: $WINNER"
else
    echo "❌ Le tournoi n'est pas terminé (statut: $STATUS)"
    exit 1
fi

echo ""
echo "🎉 Tous les tests sont passés avec succès !"
echo "🎾 Le système de tournois fonctionne correctement."
