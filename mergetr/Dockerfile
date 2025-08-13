# Dockerfile
FROM node:20-alpine

# Crée un user non-root (rootless ok)
RUN addgroup -S app && adduser -S app -G app
USER app
WORKDIR /app

# Install déterministe
COPY package*.json ./
RUN npm ci

# Copie du code (pas de bind-mount)
COPY --chown=app:app backend ./backend

# Port HTTP de l’app
EXPOSE 3000

# Commande par défaut (surclassée par compose)
CMD ["node", "backend/src/server.js"]
