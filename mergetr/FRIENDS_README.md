# Page Friends - Documentation

## Fonctionnalités implémentées

### ✅ Vue d'ensemble
- **Interface moderne** avec thème cyberpunk cohérent avec l'application
- **Navigation par onglets** : "Mes amis" et "Demandes reçues"
- **Bouton pour basculer vers la vue carrousel** (ancienne interface conservée)

### ✅ Gestion des amis
1. **Ajouter un ami**
   - Bouton "Ajouter un ami" dans l'en-tête
   - Modal avec champ de saisie pour l'ID utilisateur
   - Validation et gestion d'erreurs

2. **Liste des amis**
   - Affichage de tous les amis acceptés
   - Information : nom d'utilisateur, email, date d'amitié
   - Bouton "Supprimer" pour retirer un ami

3. **Demandes d'amis en attente**
   - Onglet séparé pour les demandes reçues
   - Boutons "Accepter" et "Rejeter"
   - Compteur de demandes en attente

### ✅ Routes Backend correspondantes
- `GET /api/user/friends` - Lister les amis
- `GET /api/user/friends/pending` - Lister les demandes en attente
- `POST /api/user/friends` - Envoyer une demande d'ami
- `POST /api/user/friends/accept` - Accepter une demande
- `POST /api/user/friends/reject` - Rejeter une demande
- `DELETE /api/user/friends/:friendId` - Supprimer un ami

## Structure des fichiers

```
frontend/src/
├── Friends.tsx              # Page principale
├── Friends.css              # Styles CSS
├── components/
│   ├── AddFriendModal.tsx   # Modal d'ajout d'ami
│   └── FriendCard.tsx       # Carte d'affichage d'ami
└── services/
    └── friendsService.ts    # Service API pour les amis
```

## Backend modifié

```
backend/src/
├── routes/
│   ├── friendsRoutes.js     # Routes des amis (prefix: /api/user)
│   └── users/user_route.js  # Routes auth modifiées (retour d'ID)
└── services/
    └── FriendService.js     # Service métier pour les amis
```

## Corrections apportées

1. **Préfixe des routes** : Changé de `/api/users` vers `/api/user` pour les routes d'amis
2. **Authentification** : 
   - JWT retourne maintenant l'ID utilisateur
   - Payload JWT utilise `sub` au lieu de `id` (standard)
3. **Registration** : Retourne maintenant l'ID utilisateur
4. **Route de suppression** : Ajoutée `DELETE /api/user/friends/:friendId`

## Test des fonctionnalités

1. **Démarrer le serveur** : `docker compose up`
2. **Tester avec les fichiers HTTP** :
   - `friends-test-simple.http` - Test basique
   - `friends-complete-test.http` - Test complet (à mettre à jour)

## Utilisation

1. **Naviguer vers la page Friends**
2. **Ajouter un ami** : Cliquer sur "Ajouter un ami", saisir l'ID utilisateur
3. **Gérer les demandes** : Aller dans l'onglet "Demandes reçues"
4. **Voir ses amis** : Onglet "Mes amis" avec option de suppression
5. **Vue carrousel** : Bouton pour revenir à l'ancienne interface

## Notes techniques

- **TypeScript** : Types stricts pour toutes les interfaces
- **Gestion d'état** : useState pour la gestion locale
- **API calls** : Service centralisé avec gestion d'erreurs
- **CSS** : Classes CSS modulaires et responsive
- **UX** : Loading states, messages d'erreur, confirmations
