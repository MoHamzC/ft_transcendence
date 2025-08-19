/*
routes/index.ts — 📚 Registre central des routes

    - Rassemble toutes les routes en un seul endroit.

    - Regroupe les modules de routes : auth, users, game, matchmaking, etc.

    - Évite les appels app.get(...) dispersés partout

    - Permet un autoload propre et lisible
*/


// src/routes/index.js
import authRoutes from './auth.route.js';
import userRoutes from './user.route.js';
import oauthRoutes from './oauth.js';
import userOtpRoutes from './user/user_route.js';
import vaultRoutes from './vault.route.js';

export async function registerRoutes(app)
{
    app.register(authRoutes, { prefix: '/api/auth' });
    app.register(userRoutes, { prefix: '/api/user' });
    app.register(oauthRoutes, { prefix: '/auth' });
    app.register(userOtpRoutes, { prefix: '/api/users' });
    app.register(vaultRoutes, { prefix: '/api/vault' });
}