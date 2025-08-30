// src/plugins/security.js
// Plugin de sécurité centralisé pour Fastify
import fp from 'fastify-plugin';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import cors from '@fastify/cors';
import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';

/**
 * Plugin de sécurité complet pour ft_transcendence
 * Inclut: CORS, Helmet, Rate Limiting, Sanitisation XSS
 */
export default fp(async (app) => {
    // 1. Headers de sécurité avec Helmet - EN PREMIER
    await app.register(helmet, {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Nécessaire pour Vite en dev
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'", "ws:", "wss:"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
            },
        },
        crossOriginEmbedderPolicy: false, // Peut causer des problèmes avec OAuth
        hsts: false, // Désactivé car nous sommes en HTTP en dev
        xssFilter: true,
        noSniff: true,
        frameguard: { action: 'deny' },
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
    });

    // 2. Headers de sécurité manuels pour s'assurer qu'ils sont présents
    app.addHook('onSend', async (request, reply, payload) => {
        reply.header('X-Frame-Options', 'DENY');
        reply.header('X-Content-Type-Options', 'nosniff');
        reply.header('X-XSS-Protection', '1; mode=block');
        reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
        reply.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        return payload;
    });

    // 3. CORS sécurisé
    await app.register(cors, {
        origin: (origin, callback) => {
            // En développement, autoriser localhost
            if (process.env.NODE_ENV === 'development') {
                const allowedOrigins = [
                    'http://localhost:3000',
                    'http://localhost:5173', // Vite dev server
                    'https://localhost:3000',
                    'https://localhost:5173'
                ];
                
                if (!origin || allowedOrigins.includes(origin)) {
                    callback(null, true);
                } else {
                    callback(null, true); // En dev, on autorise tout pour simplifier
                }
            } else {
                // En production, être plus strict
                const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['https://localhost'];
                
                if (!origin || allowedOrigins.includes(origin)) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'), false);
                }
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    });

    // 4. Rate Limiting global
    await app.register(rateLimit, {
        global: true,
        max: 100, // 100 requêtes
        timeWindow: '1 minute', // par minute
        errorResponseBuilder: (request, context) => {
            return {
                error: 'Rate limit exceeded',
                message: `Too many requests. Try again in ${Math.round(context.ttl / 1000)} seconds.`,
                retryAfter: Math.round(context.ttl / 1000)
            };
        }
    });

    // 5. Middleware de sanitisation XSS
    app.addHook('preHandler', async (request, reply) => {
        if (request.body && typeof request.body === 'object') {
            sanitizeObject(request.body);
        }
        
        if (request.query && typeof request.query === 'object') {
            sanitizeObject(request.query);
        }
    });

    // 6. Validation d'email renforcée
    app.decorate('validateEmail', (email) => {
        if (!email || typeof email !== 'string') {
            return false;
        }
        
        // Validation basique
        if (!validator.isEmail(email)) {
            return false;
        }
        
        // Vérifications supplémentaires
        if (email.length > 254) { // RFC 5321
            return false;
        }
        
        // Bloquer certains domaines suspects
        const suspiciousDomains = ['tempmail.org', '10minutemail.com', 'guerrillamail.com'];
        const domain = email.split('@')[1]?.toLowerCase();
        
        if (suspiciousDomains.includes(domain)) {
            return false;
        }
        
        return true;
    });

    // 7. Validation de mot de passe renforcée
    app.decorate('validatePassword', (password) => {
        if (!password || typeof password !== 'string') {
            return { valid: false, message: 'Password is required' };
        }
        
        if (password.length < 12) {
            return { valid: false, message: 'Password must be at least 12 characters long' };
        }
        
        if (password.length > 128) {
            return { valid: false, message: 'Password must be less than 128 characters' };
        }
        
        // Vérifier la complexité
        const hasLower = /[a-z]/.test(password);
        const hasUpper = /[A-Z]/.test(password);
        const hasDigit = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
        
        if (!hasLower || !hasUpper || !hasDigit || !hasSpecial) {
            return {
                valid: false,
                message: 'Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character'
            };
        }
        
        // Vérifier contre les mots de passe communs
        const commonPasswords = [
            'password123', 'admin123', 'qwerty123', '123456789',
            'password1234', 'admin1234', 'letmein123'
        ];
        
        if (commonPasswords.includes(password.toLowerCase())) {
            return { valid: false, message: 'Password is too common' };
        }
        
        return { valid: true };
    });

    // 8. Middleware de logging des tentatives suspectes
    app.addHook('preHandler', async (request, reply) => {
        const suspiciousPatterns = [
            /\.\./,          // Path traversal
            /<script/i,      // XSS basique
            /union\s+select/i, // SQL injection
            /javascript:/i,   // JavaScript injection
            /%3C%73%63%72%69%70%74/i // Encoded script tag
        ];
        
        const url = request.url;
        const userAgent = request.headers['user-agent'] || '';
        
        for (const pattern of suspiciousPatterns) {
            if (pattern.test(url) || pattern.test(userAgent)) {
                app.log.warn({
                    type: 'security_alert',
                    ip: request.ip,
                    url: url,
                    userAgent: userAgent,
                    pattern: pattern.toString()
                }, 'Suspicious request detected');
                break;
            }
        }
    });

    app.log.info('✅ Security plugin loaded with CORS, Helmet, Rate Limiting, and XSS protection');
});

/**
 * Fonction de sanitisation récursive pour les objets
 * @param {object} obj - Objet à sanitiser
 */
function sanitizeObject(obj) {
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            if (typeof obj[key] === 'string') {
                // Sanitiser les chaînes avec DOMPurify
                obj[key] = DOMPurify.sanitize(obj[key], {
                    ALLOWED_TAGS: [], // Pas de tags HTML autorisés
                    ALLOWED_ATTR: []  // Pas d'attributs autorisés
                });
                
                // Nettoyer les caractères de contrôle
                obj[key] = obj[key].replace(/[\x00-\x1f\x7f-\x9f]/g, '');
                
                // Limiter la longueur
                if (obj[key].length > 10000) {
                    obj[key] = obj[key].substring(0, 10000);
                }
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitizeObject(obj[key]);
            }
        }
    }
}
