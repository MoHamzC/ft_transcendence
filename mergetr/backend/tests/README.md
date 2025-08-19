# Tests StatsService - ft_transcendence

Ce dossier contient tous les tests pour le service de statistiques du projet ft_transcendence.

## 📁 Structure des tests

```
tests/
├── README.md                    # Ce fichier
├── stats.http                   # Tests HTTP basiques
├── stats-complete.http          # Tests HTTP complets avec scenarios
├── test-data.sql               # Données de test pour la DB
├── test-stats.sh               # Script automatisé bash
└── StatsService.test.js        # Tests unitaires Jest
```

## 🚀 Exécution des tests

### 1. Prérequis

Assurez-vous que le serveur backend est démarré :

```bash
cd backend
npm start
# Le serveur doit être accessible sur http://localhost:5001
```

### 2. Tests automatisés (Recommandé)

```bash
cd backend/tests
./test-stats.sh
```

Ce script va :
- ✅ Vérifier la connexion au serveur
- ✅ Créer des utilisateurs de test
- ✅ Tester l'authentification
- ✅ Vérifier les statistiques initiales
- ✅ Tester le leaderboard
- ✅ Valider la pagination
- ✅ Tester la sécurité (tokens invalides)

### 3. Tests HTTP manuels

Utilisez VS Code avec l'extension REST Client :

1. Ouvrez `stats.http` ou `stats-complete.http`
2. Cliquez sur "Send Request" pour chaque test
3. Remplacez `YOUR_JWT_TOKEN` par un vrai token JWT

### 4. Tests unitaires Jest (Optionnel)

```bash
cd backend
npm install --save-dev jest
npm test tests/StatsService.test.js
```

### 5. Tests avec données personnalisées

Pour tester avec des données spécifiques :

```bash
# 1. Connectez-vous à PostgreSQL
psql -h localhost -U admin -d db_transcendence

# 2. Exécutez le script de données de test
\i tests/test-data.sql

# 3. Lancez les tests
./test-stats.sh
```

## 📊 Fonctionnalités testées

### StatsService.getStats()
- ✅ Récupération des statistiques utilisateur
- ✅ Calcul du taux de victoire
- ✅ Gestion des utilisateurs sans statistiques
- ✅ Format de réponse (camelCase)
- ✅ Gestion des erreurs

### API Endpoints
- ✅ `GET /api/user/statistics` - Statistiques personnelles
- ✅ `GET /api/user/leaderboard` - Classement global
- ✅ Authentification JWT requise
- ✅ Pagination (limit/offset)
- ✅ Validation des paramètres

### Sécurité
- ✅ Authentification obligatoire
- ✅ Validation des tokens JWT
- ✅ Rejet des tokens invalides
- ✅ Protection contre l'accès non autorisé

## 🎯 Résultats attendus

### Statistiques initiales (nouvel utilisateur)
```json
{
  "stats": {
    "gamesPlayed": 0,
    "gamesWon": 0,
    "gamesLost": 0,
    "winRate": 0
  }
}
```

### Leaderboard
```json
{
  "leaderboard": [
    {
      "id": "uuid",
      "email": "player@example.com",
      "wins": 10,
      "games": 15
    }
  ]
}
```

### Codes d'erreur
- `200` - Succès
- `401` - Non authentifié
- `500` - Erreur serveur

## 🐛 Dépannage

### Le serveur n'est pas accessible
```bash
# Vérifiez que le serveur est démarré
curl http://localhost:5001/healthcheck

# Redémarrez le serveur si nécessaire
cd backend && npm start
```

### Erreurs de base de données
```bash
# Vérifiez la connexion PostgreSQL
docker-compose ps

# Réinitialisez la DB si nécessaire
npm run migrate
```

### Tests qui échouent
1. Vérifiez les logs du serveur
2. Assurez-vous que la DB est initialisée
3. Vérifiez que les variables d'environnement sont correctes

## 📝 Ajout de nouveaux tests

Pour ajouter de nouveaux tests :

1. **Tests HTTP** : Ajoutez dans `stats-complete.http`
2. **Tests unitaires** : Complétez `StatsService.test.js`
3. **Tests automatisés** : Modifiez `test-stats.sh`

## 🔗 Liens utiles

- [Documentation Fastify](https://www.fastify.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [JWT.io](https://jwt.io/) - Décodeur JWT
- [REST Client VS Code](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)

---

**Note** : Ces tests sont basés sur les exigences du projet ft_transcendence et valident l'implémentation du module "User and Game Stats Dashboards" selon le sujet officiel.
