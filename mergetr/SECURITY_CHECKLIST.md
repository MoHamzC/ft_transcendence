# 📋 CHECKLIST OBLIGATOIRE - ft_transcendence

## 🔒 Sécurité (OBLIGATOIRE selon le sujet)

### ✅ **Mots de passe hashés** 
- **Status** : ✅ IMPLÉMENTÉ
- **Détails** : bcrypt avec 12 rounds de salt
- **Fichier** : `backend/src/services/AuthService.js`

### ✅ **Protection SQL Injection** 
- **Status** : ✅ IMPLÉMENTÉ
- **Détails** : Requêtes paramétrées exclusivement
- **Fichier** : `backend/src/db/db.js`

### ✅ **Protection XSS** 
- **Status** : ✅ IMPLÉMENTÉ
- **Détails** : DOMPurify + validation stricte
- **Fichier** : `backend/src/plugins/security.js`

### ✅ **HTTPS obligatoire** 
- **Status** : ✅ IMPLÉMENTÉ
- **Détails** : Serveur HTTPS sur port 3443
- **Commande** : `make enable-https`

### ✅ **Validation des formulaires** 
- **Status** : ✅ IMPLÉMENTÉ
- **Détails** : Schémas JSON Fastify + validation côté serveur
- **Fichier** : `backend/src/routes/user/user_schema.js`

### ✅ **Routes protégées** 
- **Status** : ✅ IMPLÉMENTÉ
- **Détails** : JWT + middleware d'authentification
- **Fichier** : `backend/src/plugins/jwt.js`

---

## 🎯 Points à vérifier/améliorer

### 1. **WebSocket sécurisé (WSS)**
- **Status** : ⚠️ À VÉRIFIER
- **Action** : Vérifier si les WebSockets utilisent WSS au lieu de WS

### 2. **Validation côté frontend**
- **Status** : ⚠️ À VÉRIFIER  
- **Action** : Vérifier la validation des formulaires React

### 3. **2FA (optionnel mais recommandé)**
- **Status** : ❓ NON IMPLÉMENTÉ
- **Action** : Module JWT Security avec 2FA

### 4. **Game security**
- **Status** : ⚠️ À VÉRIFIER
- **Action** : Vérifier la sécurité du jeu Pong

---

## 🚨 ACTIONS PRIORITAIRES

1. **Vérifier WebSockets → WSS**
2. **Validation frontend React** 
3. **Sécurité du jeu Pong**
4. **Tests de pénétration**

---

## 📊 Score actuel : 90-95/100
**Objectif** : 100/100 avec tous les points obligatoires
