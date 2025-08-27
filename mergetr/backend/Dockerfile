# Dockerfile pour le backend ft_transcendence
FROM node:24-alpine

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration
COPY backend/package*.json ./

# Installer les dépendances (prod + dev)
RUN npm ci && npm cache clean --force

# Copier le code source du backend
COPY backend/ .

# Changer la propriété des fichiers
RUN chown -R nextjs:nodejs /app
USER nextjs

# Exposer le port
EXPOSE 5001

# Variables d'environnement par défaut
ENV NODE_ENV=development
ENV PORT=5001

# Commande de démarrage (sera surchargée par compose.yaml)
CMD ["npm", "run", "dev"]
