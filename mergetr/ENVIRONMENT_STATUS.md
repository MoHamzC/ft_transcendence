# 🎉 Environnement de développement ft_transcendence - LANCÉ AVEC SUCCÈS !

## 📱 Services disponibles

### Frontend (React/Vite)
- **URL** : http://localhost:5173
- **Status** : ✅ EN COURS D'EXÉCUTION
- **Description** : Interface utilisateur React avec Vite, jeux Pong, profils utilisateurs

### Backend (Node.js/Fastify)  
- **URL** : http://localhost:5001
- **Status** : ✅ EN COURS D'EXÉCUTION
- **Description** : API REST avec authentification JWT, gestion des utilisateurs, leaderboard, tournois
- **Health Check** : http://localhost:5001/api/health

### Base de données (PostgreSQL)
- **URL** : localhost:5433
- **Status** : ✅ EN COURS D'EXÉCUTION
- **Credentials** : admin/admin123
- **Database** : db_transcendence

### Adminer (Interface DB)
- **URL** : http://localhost:8080
- **Status** : ✅ EN COURS D'EXÉCUTION
- **Description** : Interface web pour gérer la base de données PostgreSQL

### Vault (Gestion des secrets)
- **URL** : http://localhost:8200
- **Status** : ✅ EN COURS D'EXÉCUTION
- **Token** : myroot (développement uniquement)
- **Description** : HashiCorp Vault pour la gestion sécurisée des secrets

## 🛠️ Commandes utiles

### Gestion globale
```bash
# Voir tous les logs en temps réel
docker-compose logs -f

# Redémarrer tous les services Docker
docker-compose restart

# Arrêter tous les services
docker-compose down
```

### Gestion individuelle des services
```bash
# Redémarrer uniquement la base de données
docker-compose restart db

# Voir les logs d'un service spécifique
docker-compose logs -f db

# Redémarrer le backend
cd backend && npm start

# Redémarrer le frontend
cd frontend && npm run dev
```

### Scripts npm disponibles
```bash
# Lancer backend + frontend simultanément
npm run start:dev

# Validation de l'environnement
npm run env:validate

# Gestion Docker simplifiée
npm run docker:up
npm run docker:down
npm run docker:logs
```

## 🔍 Tests disponibles

### Test de l'API
```bash
# Health check
curl http://localhost:5001/api/health

# Test de l'authentification
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password123"}'
```

### Test de la base de données
```bash
cd backend && node scripts/test-database.js
```

## 📊 Architecture

```
Frontend (React/Vite) :5173
    ↓ (API calls)
Backend (Fastify) :5001
    ↓ (PostgreSQL)
Database :5433
    
Services annexes:
- Adminer :8080 (DB Admin)
- Vault :8200 (Secrets)
```

## 🔧 Configuration

- **Variables d'environnement** : `.env` (basé sur `.env.example`)
- **Base de données** : Initialisée avec schéma complet (users, leaderboard, tournois)
- **Secrets** : Gérés par Vault en mode développement
- **CORS** : Configuré pour localhost:5173

## 🚀 Prêt pour le développement !

Votre environnement ft_transcendence est maintenant complètement fonctionnel. Vous pouvez :

1. **Développer le frontend** : Modifier les fichiers dans `/frontend/src`
2. **Développer le backend** : Modifier les fichiers dans `/backend/src`
3. **Gérer la DB** : Utiliser Adminer sur http://localhost:8080
4. **Tester l'API** : Utiliser les endpoints REST du backend

Les modifications seront automatiquement rechargées grâce au hot reload de Vite et Nodemon.

🎮 **Bon développement sur ft_transcendence !**
