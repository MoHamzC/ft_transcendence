# Architecture de Gestion des Tournois - ft_transcendence

## 🎯 Vue d'ensemble

Cette documentation décrit l'architecture améliorée de gestion des tournois pour le projet ft_transcendence, en respectant strictement les exigences du sujet qui exigent une séparation claire entre la logique de tournoi et le game design.

## 📋 Séparation des Responsabilités

### Backend (Node.js/Fastify) - Gestion Pure du Tournoi

**Responsabilités :**
- ✅ Création et gestion des tournois
- ✅ Inscription des joueurs (avec ou sans compte utilisateur)
- ✅ Génération automatique des matchs (matchmaking)
- ✅ Gestion de la progression des tours
- ✅ Enregistrement des résultats de match (score uniquement)
- ✅ Notifications en temps réel (WebSocket)
- ✅ Annonces des prochains matchs
- ✅ Gestion des statuts et de la progression

**Ce que le backend NE gère PAS :**
- ❌ Vitesse de la balle
- ❌ Vitesse des raquettes
- ❌ Règles de gameplay spécifiques
- ❌ Logique de collision
- ❌ Rendu du jeu
- ❌ Mécaniques de jeu

### Frontend (React/TypeScript) - Game Design et Interface

**Responsabilités :**
- ✅ Rendu du jeu Pong
- ✅ Gestion des règles de gameplay
- ✅ Configuration de la vitesse de balle/raquettes
- ✅ Détection des collisions
- ✅ Interface utilisateur du tournoi
- ✅ Envoi des résultats au backend après chaque match
- ✅ Affichage des notifications en temps réel

## 🏗️ Architecture Technique

### Services Backend

#### 1. TournamentService.js
```javascript
// Fonctionnalités principales :
- createTournament()          // Création de tournois
- registerPlayer()            // Inscription joueurs
- startTournament()           // Démarrage automatique
- recordMatchResult()         // Enregistrement des scores
- generateNextRound()         // Progression automatique
```

#### 2. TournamentNotificationService.js
```javascript
// Notifications WebSocket :
- subscribe()                 // Abonnement aux notifications
- notifyTournamentUpdate()    // Notifications de progression
- announceNextMatch()         // Annonce des matchs
```

### Schéma de Base de Données

```sql
-- NETTOYÉ : Plus de colonnes game_rules ou game_metadata
tournaments               // Tournois
tournament_participants    // Participants
tournament_matches        // Matchs (score uniquement)
```

### API REST Endpoints

```http
POST /api/tournaments                    // Créer tournoi
POST /api/tournaments/:id/register       // S'inscrire
POST /api/tournaments/:id/start          // Démarrer
POST /api/matches/:id/result             // Enregistrer résultat
GET  /api/tournaments/:id/next-match     // Prochain match
```

### WebSocket Events

```javascript
// Événements de notification :
'tournament_started'      // Tournoi démarré
'match_announced'         // Nouveau match annoncé
'match_finished'          // Match terminé
'tournament_finished'     // Tournoi terminé
```

## 🎮 Flux de Jeu

### 1. Création et Inscription
1. Admin crée un tournoi via l'API
2. Joueurs s'inscrivent (avec ou sans compte)
3. Vérification automatique des alias uniques

### 2. Démarrage du Tournoi
1. Démarrage manuel via l'API
2. Génération automatique des matchs du 1er tour
3. Notification WebSocket aux participants

### 3. Déroulement des Matchs
1. **Frontend** : Les joueurs voient l'annonce du match
2. **Frontend** : Le jeu Pong se lance avec les règles configurées côté client
3. **Frontend** : Détection de fin de match et calcul du score
4. **Frontend** : Envoi du résultat au backend via API
5. **Backend** : Validation basique (scores cohérents) et enregistrement
6. **Backend** : Progression automatique vers le tour suivant

### 4. Progression Automatique
1. Vérification si le tour est terminé
2. Génération automatique du tour suivant
3. Notifications des prochains matchs
4. Détection automatique de fin de tournoi

## 🔧 Implémentation

### Suppression du Game Design côté Backend

**Fichiers supprimés :**
- `gameRulesValidator.js` (middleware supprimé)

**Colonnes SQL supprimées :**
- `tournament_matches.game_rules`
- `tournament_matches.game_metadata`

**Code nettoyé :**
- Suppression de toute validation de vitesse de balle/raquette
- Suppression des règles de jeu configurables
- Simplification : seuls les scores sont stockés

### Validation Minimale Backend

Le backend ne valide que :
- Scores non négatifs
- Pas de match nul (élimination directe)
- Cohérence gagnant/scores

## 🧪 Tests

### Tests REST (`tournaments.http`)
- Création de tournois
- Inscription de joueurs
- Démarrage et progression
- Enregistrement des résultats

### Tests de Conformité
- Séparation stricte des responsabilités
- Pas de règles de jeu côté backend
- Progression automatique du tournoi

## 📝 Points de Conformité ft_transcendence

✅ **Tournoi géré côté backend** : Logique de tournoi uniquement  
✅ **Game design côté frontend** : Toutes les règles de jeu  
✅ **API claire** : Séparation nette des responsabilités  
✅ **Notifications temps réel** : WebSocket pour la progression  
✅ **Joueurs sans compte** : Inscription avec alias uniquement  
✅ **Matchmaking automatique** : Génération de tours  
✅ **Progression automatique** : Pas d'intervention manuelle  

## 🚀 Déploiement

L'architecture respecte les exigences du sujet ft_transcendence :
- Backend léger focalisé sur la gestion du tournoi
- Frontend responsable de tout le game design
- Séparation claire et maintenable
- Conformité avec les standards 42
