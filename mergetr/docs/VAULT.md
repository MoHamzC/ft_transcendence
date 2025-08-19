# 🔐 HashiCorp Vault Integration - ft_transcendence

## Vue d'ensemble

Ce projet intègre **HashiCorp Vault** pour la gestion sécurisée des secrets. Vault remplace le stockage en plain text des secrets dans les fichiers `.env`.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Vault         │
│                 │    │                 │    │                 │
│                 │───▶│  VaultService   │───▶│  Secrets Store  │
│                 │    │  OAuthService   │    │                 │
│                 │    │  EmailService   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   PostgreSQL    │
                       │                 │
                       └─────────────────┘
```

## 🚀 Démarrage rapide

### 1. Lancer l'infrastructure complète

```bash
# Démarrer tous les services (Vault, DB, Backend)
npm run docker:up

# Attendre que Vault soit prêt, puis initialiser les secrets
npm run vault:init

# Accéder à l'interface Vault
npm run vault:ui
```

### 2. Vérifier l'intégration

```bash
# Tester la santé de Vault
curl http://localhost:3000/api/vault/health

# Lister les secrets disponibles
curl http://localhost:3000/api/vault/secrets
```

## 🔑 Secrets gérés par Vault

### Secrets de base de données
- **Chemin** : `secret/database`
- **Contenu** : `host`, `port`, `user`, `password`, `database`

### Secret JWT
- **Chemin** : `secret/jwt`
- **Contenu** : `secret`

### Secrets OAuth
- **42** : `secret/oauth/42` → `client_id`, `client_secret`, `redirect_uri`
- **GitHub** : `secret/oauth/github` → `client_id`, `client_secret`, `redirect_uri`
- **Google** : `secret/oauth/google` → `client_id`, `client_secret`, `redirect_uri`

### Configuration Email
- **Chemin** : `secret/email`
- **Contenu** : `host`, `user`, `password`

## 🛠️ Services implémentés

### VaultService.js
Service principal pour interagir avec Vault :
- Lecture/écriture de secrets
- Initialisation automatique des secrets de dev
- Health checks
- Fallback sur les variables d'environnement

### OAuthService.js
Service OAuth sécurisé qui récupère automatiquement les secrets depuis Vault :
- Configuration dynamique des providers
- Gestion des tokens d'accès
- URLs d'autorisation sécurisées

### EmailService.js
Service email utilisant les credentials Vault :
- Configuration SMTP sécurisée
- Envoi d'emails OTP
- Tests de connexion

## 🔧 Configuration

### Variables d'environnement requises

```bash
# Vault
VAULT_ADDR=http://vault:8200
VAULT_TOKEN=myroot

# Les autres variables servent de fallback
# si Vault n'est pas disponible
```

### Dockerfile
Le conteneur backend inclut maintenant :
- Dépendance `node-vault`
- Variables d'environnement Vault
- Attente de la disponibilité de Vault

## 🧪 Tests

### Tests REST
Fichier : `backend/REST client tests/vault.http`

```bash
# Lancer tous les tests Vault
npm run test:http -- --include="**/vault.http"
```

### Tests manuels

```bash
# Health check
curl http://localhost:3000/api/vault/health

# Liste des secrets (dev uniquement)
curl http://localhost:3000/api/vault/secrets

# Lire un secret spécifique
curl http://localhost:3000/api/vault/secret/database
```

## 🔒 Sécurité

### En développement
- Token root simple : `myroot`
- Secrets initialisés automatiquement
- Interface web accessible
- Routes d'administration activées

### En production (TODO)
- [ ] Authentification par certificats
- [ ] Rotation automatique des secrets
- [ ] Politiques d'accès restrictives
- [ ] Audit logging
- [ ] Haute disponibilité

## 📊 Monitoring

### Health checks disponibles
- **Vault** : `/api/vault/health`
- **Database** : Via Vault secrets
- **OAuth** : Configuration dynamique testée

### Logs à surveiller
```bash
# Logs Vault
docker-compose logs vault

# Logs backend avec intégration Vault
docker-compose logs node
```

## 🚨 Dépannage

### Vault non disponible
Le système utilise automatiquement les variables d'environnement en fallback.

### Secrets manquants
```bash
# Réinitialiser les secrets de dev
curl -X POST http://localhost:3000/api/vault/init-dev-secrets
```

### Problèmes de connexion
```bash
# Vérifier le statut de Vault
docker-compose exec vault vault status

# Redémarrer Vault
docker-compose restart vault
```

## 📚 Ressources

- [Documentation Vault](https://www.vaultproject.io/docs)
- [API Vault](https://www.vaultproject.io/api-docs)
- [Client Node.js](https://github.com/kr1sp1n/node-vault)

## 🔄 Migration depuis .env

Les variables suivantes ont été migrées vers Vault :
- ✅ `POSTGRES_PASSWORD` → `secret/database/password`
- ✅ `JWT_SECRET` → `secret/jwt/secret`
- ✅ `CLIENT_SECRET_42` → `secret/oauth/42/client_secret`
- ✅ `GITHUB_CLIENT_SECRET` → `secret/oauth/github/client_secret`
- ✅ `GOOGLE_CLIENT_SECRET` → `secret/oauth/google/client_secret`
- ✅ `MAIL_PASS` → `secret/email/password`

Les variables publiques restent dans `.env` pour la configuration Docker.
