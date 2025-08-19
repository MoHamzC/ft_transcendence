# 🎾 Guide de test du système de tournois

Ce guide vous explique comment tester complètement le système de tournois de ft_transcendence.

## 📋 Prérequis

1. **Projet démarré** :
   ```bash
   make up
   ```

2. **Base de données migrée** :
   ```bash
   make migrate
   ```

3. **Données de test** (optionnel) :
   ```bash
   make seed
   ```

## 🧪 Types de tests disponibles

### 1. Tests automatisés détaillés
```bash
make test-tournament
```
- **Durée** : ~2 minutes
- **Ce qui est testé** : Cycle complet d'un tournoi de 4 joueurs
- **Sortie** : Logs détaillés avec chaque étape

### 2. Tests rapides
```bash
make test-tournament-quick
```
- **Durée** : ~30 secondes
- **Ce qui est testé** : Fonctionnalités essentielles
- **Sortie** : Résumé des résultats

### 3. Tests unitaires
```bash
make test-unit
```
- **Durée** : ~1 minute
- **Ce qui est testé** : Chaque fonction du service
- **Sortie** : Rapport de couverture Jest

## 🔍 Tests manuels avec l'API

### Étape 1 : Créer un tournoi
```bash
curl -X POST http://localhost:5001/api/tournaments \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mon Tournoi Test",
    "description": "Test manuel",
    "maxPlayers": 4,
    "type": "elimination"
  }'
```

**Résultat attendu** : Un objet tournoi avec `id`, `status: "registration"`

### Étape 2 : Inscrire des joueurs
```bash
# Joueur 1
curl -X POST http://localhost:5001/api/tournaments/{TOURNAMENT_ID}/register \
  -H "Content-Type: application/json" \
  -d '{"alias": "Alice"}'

# Joueur 2
curl -X POST http://localhost:5001/api/tournaments/{TOURNAMENT_ID}/register \
  -H "Content-Type: application/json" \
  -d '{"alias": "Bob"}'

# Répéter pour Charlie et Diana
```

### Étape 3 : Démarrer le tournoi
```bash
curl -X POST http://localhost:5001/api/tournaments/{TOURNAMENT_ID}/start
```

**Résultat attendu** : `{"success": true}`

### Étape 4 : Récupérer le prochain match
```bash
curl http://localhost:5001/api/tournaments/{TOURNAMENT_ID}/next-match
```

### Étape 5 : Enregistrer un résultat
```bash
curl -X POST http://localhost:5001/api/matches/{MATCH_ID}/result \
  -H "Content-Type: application/json" \
  -d '{
    "winnerId": "{PARTICIPANT_ID}",
    "player1Score": 11,
    "player2Score": 7
  }'
```

### Étape 6 : Vérifier l'état du tournoi
```bash
curl http://localhost:5001/api/tournaments/{TOURNAMENT_ID}
```

## 📊 Scénarios de test complets

### Scénario 1 : Tournoi normal 4 joueurs
1. ✅ Créer tournoi
2. ✅ Inscrire 4 joueurs
3. ✅ Démarrer → 2 demi-finales générées
4. ✅ Jouer demi-finale 1
5. ✅ Jouer demi-finale 2 → Finale générée
6. ✅ Jouer finale → Tournoi terminé

### Scénario 2 : Tournoi avec nombre impair
1. ✅ Créer tournoi
2. ✅ Inscrire 3 joueurs
3. ✅ Démarrer → 1 match + 1 exempt
4. ✅ Jouer le match → Finale avec l'exempt
5. ✅ Jouer finale

### Scénario 3 : Gestion des erreurs
1. ❌ Inscription avec alias dupliqué
2. ❌ Démarrage avec 1 seul joueur
3. ❌ Inscription sur tournoi complet
4. ❌ Accès à tournoi inexistant

## 🐛 Débogage

### Logs en temps réel
```bash
# Tous les services
docker-compose logs -f

# Backend seulement
docker-compose logs -f backend

# Base de données
docker-compose logs -f db
```

### Accès direct à la base
```bash
docker exec -it mergetr-db-1 psql -U ft_transcendence -d ft_transcendence_db
```

### Requêtes utiles pour le debug
```sql
-- Voir tous les tournois
SELECT id, name, status, max_players FROM tournaments;

-- Voir les participants d'un tournoi
SELECT t.name, tp.alias, tp.registration_order 
FROM tournaments t 
JOIN tournament_participants tp ON t.id = tp.tournament_id 
WHERE t.id = 'TOURNAMENT_ID';

-- Voir l'état des matchs
SELECT tm.round_number, tm.match_number, tm.status,
       p1.alias as player1, p2.alias as player2, w.alias as winner
FROM tournament_matches tm
LEFT JOIN tournament_participants p1 ON tm.player1_id = p1.id
LEFT JOIN tournament_participants p2 ON tm.player2_id = p2.id  
LEFT JOIN tournament_participants w ON tm.winner_id = w.id
WHERE tm.tournament_id = 'TOURNAMENT_ID'
ORDER BY tm.round_number, tm.match_number;
```

## ✅ Critères de validation

Un système de tournois fonctionnel doit :

1. **Création** : Créer des tournois avec validation des paramètres
2. **Inscription** : Gérer les alias uniques et les limites de joueurs
3. **Démarrage** : Générer automatiquement les matchs du premier tour
4. **Progression** : Avancer automatiquement entre les tours
5. **Fin** : Détecter la fin et désigner un gagnant
6. **Erreurs** : Gérer gracieusement tous les cas d'erreur
7. **API** : Exposer toutes les fonctionnalités via REST
8. **Performance** : Répondre rapidement même avec 32 joueurs

## 🚀 Prochaines étapes

Après validation du système de base :
1. **Intégration frontend** : Interface utilisateur
2. **WebSockets** : Notifications en temps réel
3. **Authentification** : Liaison avec les comptes utilisateurs
4. **Statistiques** : Intégration avec StatsService
5. **IA** : Participation de bots aux tournois
