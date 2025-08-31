#!/bin/bash
# open-adminer.sh - Ouvre Adminer avec les paramètres pré-remplis

echo "🗃️ Ouverture d'Adminer..."

# URL avec paramètres pré-remplis (sauf le mot de passe pour la sécurité)
ADMINER_URL="http://localhost:8080/?pgsql=db&username=admin&db=db_transcendence"

if command -v xdg-open &> /dev/null; then
    # Linux
    xdg-open "$ADMINER_URL"
    echo "✅ Adminer ouvert dans votre navigateur"
elif command -v open &> /dev/null; then
    # macOS
    open "$ADMINER_URL"
    echo "✅ Adminer ouvert dans votre navigateur"
else
    echo "🔗 Lien Adminer: $ADMINER_URL"
    echo "📝 Mot de passe: test"
fi

echo ""
echo "💡 Conseil: Le mot de passe 'test' sera demandé à la connexion"
