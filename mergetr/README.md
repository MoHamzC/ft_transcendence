# ft_transcendence

## Description
Projet de groupe 42 - Application web avec jeu Pong en temps réel.

## Architecture
Le projet utilise une architecture mergée où le backend Fastify sert à la fois l'API et les fichiers statiques du frontend React compilé.

## Structure du projet

```
mergetr/
├── backend/          # API Fastify + serveur de fichiers statiques
│   ├── src/         # Code source du backend
│   ├── public/      # Fichiers statiques du frontend (généré)
│   └── package.json
├── frontend/        # Application React
│   ├── src/        # Code source React
│   ├── dist/       # Build du frontend (généré)
│   └── package.json
├── Dockerfile      # Build multi-stage (frontend + backend)
├── compose.yaml    # Configuration Docker Compose
└── package.json    # Scripts et dépendances partagées
```

## Installation et démarrage

### Installation des dépendances
```bash
npm run setup
```

### Mode production (mergé)
```bash
# Build le frontend et le copie dans backend/public, puis démarre le serveur unique
npm run start:merged

# Ou avec Docker
docker-compose up
```

### Mode développement (séparé)
```bash
# Démarre backend (port 3000) et frontend dev server (port 5173) séparément
npm run start:dev
```

### Scripts disponibles
- `npm run start:merged` - Mode production (serveur unique sur port 3000)
- `npm run start:dev` - Mode développement (deux serveurs séparés)
- `npm run build` - Build le frontend et le copie dans backend/public
- `npm run clean` - Nettoie les builds
- `npm run docker:build` - Build l'image Docker
- `npm run migrate` - Exécute les migrations de base de données

## Contributions

