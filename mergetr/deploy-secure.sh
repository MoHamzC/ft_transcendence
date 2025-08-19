#!/bin/bash
# deploy-secure.sh - Script de déploiement sécurisé pour ft_transcendence
# Ce script installe et configure automatiquement tout le projet avec la sécurité maximale

set -euo pipefail  # Mode strict bash

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 ft_transcendence - Déploiement Sécurisé${NC}"
echo -e "${BLUE}===============================================${NC}"

# Fonction de log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
    exit 1
}

# Vérification des prérequis
check_requirements() {
    log "Vérification des prérequis..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker n'est pas installé"
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose n'est pas installé"
    fi
    
    if ! command -v node &> /dev/null; then
        error "Node.js n'est pas installé"
    fi
    
    if ! command -v npm &> /dev/null; then
        error "npm n'est pas installé"
    fi
    
    log "✅ Tous les prérequis sont satisfaits"
}

# Installation des dépendances
install_dependencies() {
    log "Installation des dépendances backend..."
    cd backend
    
    if [ ! -f package.json ]; then
        error "package.json non trouvé dans le répertoire backend"
    fi
    
    # Installation déterministe
    npm ci
    
    log "✅ Dépendances backend installées"
    cd ..
    
    if [ -d "frontend" ]; then
        log "Installation des dépendances frontend..."
        cd frontend
        npm ci
        npm run build
        cd ..
        log "✅ Frontend buildé"
    fi
}

# Configuration des certificats SSL
setup_ssl() {
    log "Configuration des certificats SSL..."
    
    mkdir -p docker/nginx/ssl
    
    if [ ! -f docker/nginx/ssl/cert.pem ]; then
        log "Génération des certificats SSL auto-signés..."
        
        # Générer une clé privée
        openssl genrsa -out docker/nginx/ssl/key.pem 2048
        
        # Générer un certificat auto-signé
        openssl req -new -x509 -key docker/nginx/ssl/key.pem \
            -out docker/nginx/ssl/cert.pem -days 365 \
            -subj "/C=FR/ST=France/L=Paris/O=42School/OU=ft_transcendence/CN=localhost"
        
        log "✅ Certificats SSL générés"
    else
        log "✅ Certificats SSL déjà présents"
    fi
}

# Configuration de l'environnement
setup_environment() {
    log "Configuration de l'environnement..."
    
    if [ ! -f .env ]; then
        if [ -f .env.secure ]; then
            log "Copie de .env.secure vers .env..."
            cp .env.secure .env
        elif [ -f .env.example ]; then
            log "Copie de .env.example vers .env..."
            cp .env.example .env
            warn "⚠️  Veuillez modifier .env avec vos vraies valeurs"
        else
            error "Aucun fichier d'environnement trouvé"
        fi
    fi
    
    log "✅ Environnement configuré"
}

# Audit de sécurité
security_audit() {
    log "Audit de sécurité..."
    
    # Vérifier les dépendances
    cd backend
    if npm audit --audit-level moderate; then
        log "✅ Aucune vulnérabilité critique détectée"
    else
        warn "⚠️  Des vulnérabilités ont été détectées, tentative de correction..."
        npm audit fix
    fi
    cd ..
    
    # Vérifier les permissions des fichiers sensibles
    if [ -f .env ]; then
        chmod 600 .env
        log "✅ Permissions .env sécurisées"
    fi
    
    if [ -f docker/nginx/ssl/key.pem ]; then
        chmod 600 docker/nginx/ssl/key.pem
        log "✅ Permissions clé SSL sécurisées"
    fi
}

# Test de la configuration
test_configuration() {
    log "Test de la configuration..."
    
    # Vérifier que tous les services peuvent démarrer
    if docker-compose -f docker-compose.secure.yml config > /dev/null 2>&1; then
        log "✅ Configuration Docker Compose valide"
    else
        error "❌ Configuration Docker Compose invalide"
    fi
    
    # Test des certificats SSL
    if [ -f docker/nginx/ssl/cert.pem ] && [ -f docker/nginx/ssl/key.pem ]; then
        if openssl x509 -in docker/nginx/ssl/cert.pem -text -noout > /dev/null 2>&1; then
            log "✅ Certificats SSL valides"
        else
            error "❌ Certificats SSL invalides"
        fi
    fi
}

# Démarrage des services
start_services() {
    log "Arrêt des anciens conteneurs..."
    docker-compose down -v 2>/dev/null || true
    
    log "Construction et démarrage des services sécurisés..."
    docker-compose -f docker-compose.secure.yml up --build -d
    
    log "Attente du démarrage des services..."
    sleep 10
    
    # Vérifier que tous les services sont démarrés
    if docker-compose -f docker-compose.secure.yml ps | grep -q "Up"; then
        log "✅ Services démarrés avec succès"
    else
        error "❌ Échec du démarrage des services"
    fi
}

# Test de santé
health_check() {
    log "Vérification de la santé des services..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -k -f https://localhost/healthz > /dev/null 2>&1; then
            log "✅ Service principal accessible via HTTPS"
            break
        fi
        
        log "Tentative $attempt/$max_attempts - En attente..."
        sleep 2
        ((attempt++))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        warn "⚠️  Le service n'est pas encore accessible, vérifiez les logs"
        docker-compose -f docker-compose.secure.yml logs --tail=20
    fi
}

# Affichage des informations finales
show_info() {
    echo -e "${GREEN}"
    echo "==============================================="
    echo "🎉 DÉPLOIEMENT SÉCURISÉ TERMINÉ !"
    echo "==============================================="
    echo -e "${NC}"
    
    echo "📱 Application disponible sur :"
    echo "   • HTTPS: https://localhost"
    echo "   • HTTP:  http://localhost (redirigé vers HTTPS)"
    echo ""
    
    echo "🔧 Services :"
    echo "   • Backend:    Port 3000 (interne)"
    echo "   • Frontend:   Servi via nginx"
    echo "   • PostgreSQL: Port 5432 (interne)"
    echo "   • Vault:      Port 8200 (interne)"
    echo ""
    
    echo "📋 Commandes utiles :"
    echo "   • Logs:           docker-compose -f docker-compose.secure.yml logs -f"
    echo "   • Arrêt:          docker-compose -f docker-compose.secure.yml down"
    echo "   • Restart:        docker-compose -f docker-compose.secure.yml restart"
    echo "   • Status:         docker-compose -f docker-compose.secure.yml ps"
    echo ""
    
    echo "🔒 Sécurité :"
    echo "   • HTTPS obligatoire avec certificats auto-signés"
    echo "   • Rate limiting activé"
    echo "   • Headers de sécurité configurés"
    echo "   • Validation XSS activée"
    echo "   • Secrets gérés par Vault"
    echo ""
    
    warn "⚠️  IMPORTANT: En production, remplacez les certificats auto-signés par des certificats valides"
}

# Fonction principale
main() {
    check_requirements
    install_dependencies
    setup_ssl
    setup_environment
    security_audit
    test_configuration
    start_services
    health_check
    show_info
}

# Gestion des signaux
trap 'error "Déploiement interrompu"' INT TERM

# Vérification que le script est exécuté depuis la racine du projet
if [ ! -f "backend/package.json" ]; then
    error "Ce script doit être exécuté depuis la racine du projet ft_transcendence"
fi

# Exécution
main "$@"
