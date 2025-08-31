#!/usr/bin/env node
/**
 * Script de validation des variables d'environnement
 * Vérifie que toutes les variables requises sont définies
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Charger les variables d'environnement
dotenv.config();

const REQUIRED_VARS = [
    'POSTGRES_HOST',
    'POSTGRES_PORT', 
    'POSTGRES_DB',
    'POSTGRES_USER',
    'POSTGRES_PASSWORD',
    'JWT_SECRET',
    'SALT_ROUNDS'
];

const OPTIONAL_VARS = [
    'NODE_ENV',
    'PORT',
    'HTTPS_PORT',
    'RESET_DB',
    'ALLOWED_ORIGINS',
    'CLIENT_ID_42',
    'CLIENT_SECRET_42',
    'REDIRECT_URI',
    'GITHUB_CLIENT_ID',
    'GITHUB_CLIENT_SECRET',
    'GITHUB_REDIRECT_URI',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REDIRECT_URI',
    'MAIL_HOST',
    'MAIL_PORT',
    'MAIL_USER',
    'MAIL_PASS',
    'MAIL_FROM',
    'VAULT_ADDR',
    'VAULT_TOKEN',
    'PRIVACY_POLICY_VERSION',
    'DEBUG',
    'LOG_LEVEL',
    'VITE_BACKEND_URL',
    'COMPOSE_PROJECT_NAME'
];

console.log('🔍 Validation des variables d\'environnement...\n');

let hasErrors = false;
let hasWarnings = false;

// Vérification des variables requises
console.log('✅ Variables REQUISES:');
for (const varName of REQUIRED_VARS) {
    const value = process.env[varName];
    if (!value) {
        console.log(`❌ ${varName}: MANQUANTE - CRITIQUE!`);
        hasErrors = true;
    } else if (varName === 'JWT_SECRET' && value.includes('change_this')) {
        console.log(`⚠️  ${varName}: Définie mais utilise la valeur par défaut - CHANGEZ EN PRODUCTION!`);
        hasWarnings = true;
    } else {
        console.log(`✅ ${varName}: OK`);
    }
}

console.log('\n📋 Variables OPTIONNELLES:');
for (const varName of OPTIONAL_VARS) {
    const value = process.env[varName];
    if (!value) {
        console.log(`⚡ ${varName}: Non définie (optionnelle)`);
    } else {
        console.log(`✅ ${varName}: OK`);
    }
}

// Vérifications spéciales
console.log('\n🔐 Vérifications de sécurité:');

// JWT Secret
if (process.env.JWT_SECRET) {
    if (process.env.JWT_SECRET.length < 32) {
        console.log('⚠️  JWT_SECRET: Trop court (min 32 caractères recommandé)');
        hasWarnings = true;
    } else {
        console.log('✅ JWT_SECRET: Longueur appropriée');
    }
}

// Base de données
if (process.env.RESET_DB === 'true') {
    console.log('⚠️  RESET_DB=true: La base de données sera réinitialisée au démarrage!');
    hasWarnings = true;
} else {
    console.log('✅ RESET_DB: Mode sécurisé (false)');
}

// Environnement
if (process.env.NODE_ENV === 'production') {
    console.log('🚀 NODE_ENV=production: Mode production activé');
    
    // Vérifications spéciales pour la production
    if (!process.env.HTTPS_PORT) {
        console.log('⚠️  HTTPS_PORT: Non défini en production');
        hasWarnings = true;
    }
    
    if (process.env.JWT_SECRET === 'change_this_super_secret_jwt_key_in_production') {
        console.log('❌ JWT_SECRET: Utilise la valeur par défaut en PRODUCTION - CRITIQUE!');
        hasErrors = true;
    }
} else {
    console.log('🔧 NODE_ENV: Mode développement');
}

// Résumé final
console.log('\n' + '='.repeat(60));
console.log('📊 RÉSUMÉ DE LA VALIDATION:');

if (hasErrors) {
    console.log('❌ ERREURS CRITIQUES détectées - L\'application ne peut pas démarrer correctement');
    console.log('💡 Corrigez les variables manquantes dans votre fichier .env');
    process.exit(1);
} else if (hasWarnings) {
    console.log('⚠️  AVERTISSEMENTS détectés - L\'application peut démarrer mais vérifiez la configuration');
    console.log('💡 Consultez les avertissements ci-dessus pour optimiser la sécurité');
} else {
    console.log('✅ Toutes les vérifications passées - Configuration OK!');
}

console.log('\n🚀 L\'application peut démarrer avec cette configuration.');
console.log('📝 Tip: Utilisez RESET_DB=true pour réinitialiser la base de données');
console.log('=' + '='.repeat(59));
