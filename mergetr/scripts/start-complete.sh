#!/bin/bash

# ====================================================================
# SCRIPT DE DÉMARRAGE COMPLET FT_TRANSCENDENCE 
# ====================================================================
# Ce script vérifie l'environnement et démarre l'application
# Usage: ./scripts/start-complete.sh [--reset-db] [--skip-validation]

set -e  # Arrêter en cas d'erreur

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages colorés
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_header() {
    echo
    echo "========================================================"
    print_message $BLUE "$1"
    echo "========================================================"
}

print_success() {
    print_message $GREEN "✅ $1"
}

print_warning() {
    print_message $YELLOW "⚠️  $1"
}

print_error() {
    print_message $RED "❌ $1"
}

# Variables
RESET_DB=false
SKIP_VALIDATION=false

# Parser les arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --reset-db)
            RESET_DB=true
            shift
            ;;
        --skip-validation)
            SKIP_VALIDATION=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [--reset-db] [--skip-validation]"
            echo "  --reset-db         Force la réinitialisation de la base de données"
            echo "  --skip-validation  Ignore la validation des variables d'environnement"
            echo "  -h, --help         Affiche cette aide"
            exit 0
            ;;
        *)
            print_error "Option inconnue: $1"
            echo "Utilisez -h ou --help pour l'aide"
            exit 1
            ;;
    esac
done

print_header "🚀 DÉMARRAGE COMPLET FT_TRANSCENDENCE"

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    print_error "Erreur: package.json non trouvé. Exécutez ce script depuis la racine du projet."
    exit 1
fi

# 1. Vérifier l'existence du fichier .env
print_header "📁 VÉRIFICATION FICHIER .env"

if [ ! -f ".env" ]; then
    print_warning "Fichier .env non trouvé"
    if [ -f ".env.example" ]; then
        print_message $BLUE "📋 Copie de .env.example vers .env..."
        cp .env.example .env
        print_success "Fichier .env créé depuis .env.example"
        print_warning "IMPORTANT: Modifiez le fichier .env avec vos vraies valeurs!"
        print_warning "Notamment: JWT_SECRET, mots de passe, clés OAuth, etc."
        echo
        print_message $YELLOW "Voulez-vous continuer avec les valeurs par défaut? (y/N)"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            print_message $BLUE "Éditez votre .env puis relancez ce script."
            exit 0
        fi
    else
        print_error "Ni .env ni .env.example trouvé!"
        print_error "Créez un fichier .env avec les variables nécessaires."
        exit 1
    fi
else
    print_success "Fichier .env trouvé"
fi

# 2. Appliquer le reset DB si demandé
if [ "$RESET_DB" = true ]; then
    print_header "🗄️  CONFIGURATION RESET DB"
    print_warning "Forçage de RESET_DB=true dans .env"
    
    # Backup de l'ancien .env
    cp .env .env.backup
    
    # Modifier RESET_DB dans le .env
    if grep -q "^RESET_DB=" .env; then
        sed -i 's/^RESET_DB=.*/RESET_DB=true/' .env
    else
        echo "RESET_DB=true" >> .env
    fi
    
    print_success "RESET_DB=true appliqué"
    print_warning "La base de données sera complètement réinitialisée!"
fi

# 3. Validation des variables d'environnement
if [ "$SKIP_VALIDATION" = false ]; then
    print_header "🔍 VALIDATION ENVIRONNEMENT"
    
    if [ -f "scripts/validate-env.js" ]; then
        node scripts/validate-env.js
        if [ $? -ne 0 ]; then
            print_error "Validation échouée. Corrigez votre .env"
            exit 1
        fi
    else
        print_warning "Script de validation non trouvé, passage..."
    fi
else
    print_warning "Validation ignorée (--skip-validation)"
fi

# 4. Installation des dépendances
print_header "📦 INSTALLATION DÉPENDANCES"

if command -v npm >/dev/null 2>&1; then
    # Backend
    if [ -d "backend" ]; then
        print_message $BLUE "Installation dépendances backend..."
        cd backend && npm install && cd ..
        print_success "Dépendances backend installées"
    fi
    
    # Frontend
    if [ -d "frontend" ]; then
        print_message $BLUE "Installation dépendances frontend..."
        cd frontend && npm install && cd ..
        print_success "Dépendances frontend installées"
    fi
    
    # Root
    print_message $BLUE "Installation dépendances racine..."
    npm install
    print_success "Dépendances racine installées"
else
    print_error "npm non trouvé! Installez Node.js et npm"
    exit 1
fi

# 5. Démarrage de l'application
print_header "🎮 DÉMARRAGE APPLICATION"

print_success "Configuration validée et prête!"
print_message $BLUE "Démarrage du serveur backend et frontend..."

# Démarrer l'application
npm run start:dev

print_success "Application démarrée avec succès!"
print_message $BLUE "Backend: http://localhost:5001"
print_message $BLUE "Frontend: http://localhost:5173 (ou selon votre config Vite)"

# Restaurer le .env si reset DB était temporaire
if [ "$RESET_DB" = true ] && [ -f ".env.backup" ]; then
    print_message $YELLOW "Tip: Vous pouvez remettre RESET_DB=false dans votre .env pour les prochains démarrages"
fi
