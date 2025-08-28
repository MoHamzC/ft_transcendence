Maquette simple pour tester Leaderboard & FriendList

Fichiers:
- index.html : page statique
- app.js : logique JS pour appeler les endpoints

Usage rapide :
- Ouvrir `frontend/mock/index.html` dans un navigateur (ou servir le dossier statique)
- Renseigner `Backend base URL` (par défaut http://localhost:5001)
- (Optionnel) Coller un token Bearer si les endpoints nécessitent auth
- Cliquer sur `Charger leaderboard` ou `Charger mes amis`
- Utiliser `Envoyer une demande` / `Accepter une demande` pour tester les routes POST

Notes :
- Cette maquette est volontairement minimale et ne remplace pas l'intégration dans l'app React
- Si ton backend tourne sur un port différent (ex: 3000), change l'URL en conséquence
