# Multi-stage build: Build frontend + Backend merged
FROM node:20-alpine AS builder

# Crée un user non-root (rootless ok)
RUN addgroup -S app && adduser -S app -G app
USER app
WORKDIR /app

# Copy root package.json and install dependencies
COPY --chown=app:app package*.json ./
RUN npm ci

# Copy backend dependencies and install
COPY --chown=app:app backend/package*.json ./backend/
RUN cd backend && npm ci

# Copy frontend dependencies and install
COPY --chown=app:app frontend/package*.json ./frontend/
RUN cd frontend && npm ci

# Copy source code
COPY --chown=app:app backend ./backend
COPY --chown=app:app frontend ./frontend

# Build frontend
RUN cd frontend && npm run build

# Production stage
FROM node:20-alpine AS production

# Crée un user non-root (rootless ok)
RUN addgroup -S app && adduser -S app -G app
USER app
WORKDIR /app

# Copy backend dependencies
COPY --chown=app:app backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

# Copy backend source
COPY --chown=app:app backend ./backend

# Copy built frontend from builder stage
COPY --from=builder --chown=app:app /app/frontend/dist ./backend/public

# Port HTTP de l'app
EXPOSE 3000

# Commande par défaut (surclassée par compose)
CMD ["node", "backend/src/server.js"]
