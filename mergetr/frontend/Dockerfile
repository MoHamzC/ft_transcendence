# Dockerfile pour le frontend ft_transcendence
FROM node:24-alpine

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

# Changer la propriété des fichiers
RUN chown -R nextjs:nodejs /app
USER nextjs

# Exposer le port Vite
EXPOSE 5173

# Variables d'environnement
ENV NODE_ENV=development

# Commande de démarrage pour le développement
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
