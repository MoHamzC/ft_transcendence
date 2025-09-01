# Multi-stage build pour optimisation
FROM node:24-alpine as builder

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration
COPY frontend/package*.json ./

# Installer les dépendances
RUN npm ci && npm cache clean --force

# Copier le code source du frontend
COPY frontend/ .

# Build pour la production
RUN npm run build

# Stage de production
FROM node:24-alpine as production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

WORKDIR /app

# Copier le build et les dépendances nécessaires
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Installer seulement les dépendances de production
RUN npm ci --only=production && npm cache clean --force

# Changer la propriété des fichiers
RUN chown -R nextjs:nodejs /app
USER nextjs

# Exposer le port
EXPOSE 5173

# Variables d'environnement
ENV NODE_ENV=production

# Servir les fichiers statiques
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]
