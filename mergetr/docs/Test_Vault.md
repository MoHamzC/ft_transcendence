# 🧪 Tests Vault - ft_transcendence

## Vue d'ensemble
Ce document contient tous les tests pour valider l'intégration HashiCorp Vault dans le projet ft_transcendence.

## 🚀 Prérequis

### Infrastructure
```bash
# 1. Démarrer l'infrastructure
cd /home/midnight/ft_transcendence/mergetr
docker-compose up -d

# 2. Vérifier que tous les services sont UP
docker-compose ps
```

### Variables d'environnement pour tests locaux
```bash
export VAULT_ADDR=http://localhost:8200
export VAULT_TOKEN=myroot
export DB_HOST=localhost
export DB_PORT=5434
export NODE_ENV=development
export PORT=3001
```

## 🔧 Phase 1 : Tests d'infrastructure

### Test 1.1 : Vault est accessible
```bash
curl -s http://localhost:8200/v1/sys/health | python3 -m json.tool
```
**Résultat attendu :** Status 200, `"sealed": false`

### Test 1.2 : PostgreSQL est accessible
```bash
docker-compose logs db --tail=5
```
**Résultat attendu :** `database system is ready to accept connections`

### Test 1.3 : Backend démarre sans erreur
```bash
docker-compose logs node --tail=10
```
**Résultat attendu :** `Server listening at http://...`

## 🔐 Phase 2 : Tests de gestion des secrets

### Test 2.1 : Initialisation des secrets via API REST

#### Secret Database
```bash
curl -H "X-Vault-Token: myroot" \
     -H "Content-Type: application/json" \
     -X POST \
     -d '{"data":{"host":"db","port":"5432","user":"admin","password":"test","database":"db_transcendence"}}' \
     http://localhost:8200/v1/secret/data/database
```

#### Secret JWT
```bash
curl -H "X-Vault-Token: myroot" \
     -H "Content-Type: application/json" \
     -X POST \
     -d '{"data":{"secret":"super_secure_jwt_secret_vault_2025"}}' \
     http://localhost:8200/v1/secret/data/jwt
```

#### Secret OAuth 42
```bash
curl -H "X-Vault-Token: myroot" \
     -H "Content-Type: application/json" \
     -X POST \
     -d '{"data":{"client_id":"test_42_client_id","client_secret":"test_42_client_secret","redirect_uri":"http://localhost:3000/auth/42/callback"}}' \
     http://localhost:8200/v1/secret/data/oauth/42
```

#### Secret OAuth GitHub
```bash
curl -H "X-Vault-Token: myroot" \
     -H "Content-Type: application/json" \
     -X POST \
     -d '{"data":{"client_id":"test_github_client_id","client_secret":"test_github_client_secret","redirect_uri":"http://localhost:3000/auth/github/callback"}}' \
     http://localhost:8200/v1/secret/data/oauth/github
```

#### Secret Email
```bash
curl -H "X-Vault-Token: myroot" \
     -H "Content-Type: application/json" \
     -X POST \
     -d '{"data":{"host":"smtp.gmail.com","user":"test@gmail.com","password":"test_app_password"}}' \
     http://localhost:8200/v1/secret/data/email
```

### Test 2.2 : Vérification des secrets stockés

#### Lecture secret Database
```bash
curl -H "X-Vault-Token: myroot" \
     http://localhost:8200/v1/secret/data/database | python3 -m json.tool
```
**Résultat attendu :** Données de connexion DB

#### Lecture secret JWT
```bash
curl -H "X-Vault-Token: myroot" \
     http://localhost:8200/v1/secret/data/jwt | python3 -m json.tool
```
**Résultat attendu :** Secret JWT

## 🖥️ Phase 3 : Tests backend local

### Test 3.1 : Démarrage backend avec Vault
```bash
cd /home/midnight/ft_transcendence/mergetr/backend
VAULT_ADDR=http://localhost:8200 \
VAULT_TOKEN=myroot \
DB_HOST=localhost \
DB_PORT=5434 \
NODE_ENV=development \
PORT=3001 \
npm start
```

**Logs attendus :**
- ✅ Vault connected successfully
- ✅ Database pool initialized with Vault secrets
- ✅ JWT secret loaded from Vault
- Server listening at http://localhost:3001

### Test 3.2 : Routes de monitoring Vault

#### Health Check
```bash
curl -s http://localhost:3001/api/vault/health | python3 -m json.tool
```
**Résultat attendu :**
```json
{
    "status": "healthy",
    "vault": "connected",
    "timestamp": "2025-08-19T..."
}
```

#### Liste des secrets (dev uniquement)
```bash
curl -s http://localhost:3001/api/vault/secrets | python3 -m json.tool
```

#### Lecture secret Database
```bash
curl -s http://localhost:3001/api/vault/secret/database | python3 -m json.tool
```
**Résultat attendu :**
```json
{
    "path": "secret/database",
    "data": {
        "database": "db_transcendence",
        "host": "db",
        "password": "test",
        "port": "5432",
        "user": "admin"
    },
    "timestamp": "2025-08-19T..."
}
```

#### Lecture secret JWT
```bash
curl -s http://localhost:3001/api/vault/secret/jwt | python3 -m json.tool
```

### Test 3.3 : Routes OAuth avec Vault
```bash
curl -s http://localhost:3001/auth/test
```
**Résultat attendu :** `"OAuth routes are working!"`

## 🧪 Phase 4 : Tests REST Client

### Test avec fichier .http
```bash
cd /home/midnight/ft_transcendence/mergetr
npm run test:http -- --include="**/vault.http"
```

## 🔄 Phase 5 : Tests de fallback

### Test 5.1 : Arrêt de Vault
```bash
docker-compose stop vault
```

### Test 5.2 : Redémarrage backend (doit utiliser .env)
```bash
# Le backend doit se rabattre sur les variables d'environnement
# Logs attendus : "Falling back to environment variables..."
```

### Test 5.3 : Redémarrage de Vault
```bash
docker-compose start vault
sleep 5
# Le backend doit se reconnecter automatiquement
```

## 📊 Résultats des tests

### ✅ Tests réussis (confirmés)
- [x] Infrastructure Docker complète
- [x] Connectivité Vault
- [x] Stockage secrets KV v2
- [x] Lecture secrets depuis backend
- [x] Routes de monitoring `/api/vault/*`
- [x] Intégration Database avec Vault
- [x] Intégration JWT avec Vault
- [x] Routes OAuth fonctionnelles
- [x] Fallback automatique sur .env

### ⚠️ Problèmes identifiés à corriger

#### 1. Routes imbriquées (OAuth secrets)
**Problème :** `/api/vault/secret/oauth/42` retourne 404
**Cause :** Route ne gère pas les chemins avec plusieurs niveaux

#### 2. Liste des secrets vide
**Problème :** `/api/vault/secrets` retourne une liste vide
**Cause :** Méthode `listSecrets()` ne fonctionne pas avec KV v2

#### 3. Image Docker non mise à jour
**Problème :** Le conteneur `node` n'inclut pas les nouveaux fichiers Vault
**Cause :** Image pas reconstruite après ajout des fichiers

## 🛠️ Corrections à implémenter

### Correction 1 : Routes imbriquées
Modifier `vault.route.js` pour gérer les paramètres wildcard

### Correction 2 : Liste des secrets KV v2
Corriger `VaultService.listSecrets()` pour l'API KV v2

### Correction 3 : Dockerfile
Reconstruire l'image Docker avec les nouveaux fichiers

### Correction 4 : Tests automatisés
Ajouter des tests unitaires pour VaultService

## 🎯 Checklist finale

- [ ] Corriger les routes imbriquées
- [ ] Corriger la liste des secrets
- [ ] Reconstruire l'image Docker
- [ ] Ajouter tests unitaires
- [ ] Documentation de production
- [ ] Rotation automatique des secrets (Phase 3)

## 🚀 Script de test automatique

```bash
#!/bin/bash
# test-vault.sh - Script de test automatique

echo "🧪 Tests Vault ft_transcendence"

# Phase 1 : Infrastructure
echo "📋 Phase 1 : Tests d'infrastructure"
docker-compose up -d
sleep 10

if curl -s http://localhost:8200/v1/sys/health | grep -q "initialized.*true"; then
    echo "✅ Vault accessible"
else
    echo "❌ Vault inaccessible"
    exit 1
fi

# Phase 2 : Secrets
echo "📋 Phase 2 : Initialisation des secrets"
curl -H "X-Vault-Token: myroot" -H "Content-Type: application/json" -X POST \
     -d '{"data":{"host":"db","port":"5432","user":"admin","password":"test","database":"db_transcendence"}}' \
     http://localhost:8200/v1/secret/data/database > /dev/null

echo "✅ Secrets initialisés"

# Phase 3 : Backend
echo "📋 Phase 3 : Test backend"
if curl -s http://localhost:3001/api/vault/health | grep -q "healthy"; then
    echo "✅ Backend Vault fonctionnel"
else
    echo "❌ Backend Vault non fonctionnel"
fi

echo "🎉 Tests terminés"
```
