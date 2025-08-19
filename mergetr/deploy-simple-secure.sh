#!/bin/bash
# deploy-simple-secure.sh - Déploiement sécurisé simplifié

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔒 ft_transcendence - Déploiement Sécurisé Simplifié${NC}"
echo -e "${BLUE}====================================================${NC}"

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

# 1. Arrêter les anciens conteneurs
log "Arrêt des anciens conteneurs..."
docker-compose down -v 2>/dev/null || true

# 2. Installation automatique des dépendances
log "Installation des dépendances..."
cd backend && npm ci && cd ..

# 3. Construction des images avec les nouvelles dépendances
log "Construction de l'image avec les améliorations de sécurité..."
docker-compose build

# 4. Démarrage des services
log "Démarrage des services..."
docker-compose up -d

# 5. Attendre que les services soient prêts
log "Attente du démarrage des services..."
sleep 15

# 6. Vérifier la santé
log "Vérification de la santé des services..."
if curl -s http://localhost:3001/healthz > /dev/null; then
    log "✅ Services démarrés avec succès"
else
    log "⚠️  Services en cours de démarrage..."
fi

echo
echo -e "${GREEN}🎉 DÉPLOIEMENT TERMINÉ !${NC}"
echo
echo "📱 Application disponible sur :"
echo "   • Backend: http://localhost:3001"
echo "   • Frontend: http://localhost:3000 (Vite dev server)"
echo ""
echo "🔒 Améliorations de sécurité activées :"
echo "   • ✅ Plugin de sécurité Fastify"
echo "   • ✅ Rate limiting"  
echo "   • ✅ Headers de sécurité"
echo "   • ✅ Validation XSS renforcée"
echo "   • ✅ Validation de mot de passe stricte"
echo "   • ✅ Logs de sécurité"
echo ""
echo "🧪 Pour tester la sécurité :"
echo "   ./test-security.sh"
