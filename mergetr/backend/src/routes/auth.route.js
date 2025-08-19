// src/routes/auth.route.js
// Allman

import { UserService, DuplicateEmailError } from '../services/UserService.js';

export default async function authRoutes(app)
{
    app.get('/status', async (_req, reply) =>
    {
        return reply.send({ status: 'Auth module OK' });
    });

    app.post('/register', {
        config: {
            rateLimit: {
                max: 5, // 5 tentatives d'inscription
                timeWindow: '1 hour' // par heure
            }
        },
        schema: {
            body: {
                type: 'object',
                required: ['email', 'password'],
                additionalProperties: false,
                properties: {
                    email: {
                        type: 'string',
                        format: 'email',
                        maxLength: 254
                    },
                    password: {
                        type: 'string',
                        minLength: 12,
                        maxLength: 128,
                        pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};\':"\\\\|,.<>\\/?]).{12,}$'
                    }
                }
            }
        }
    }, async (req, reply) =>
    {
        const { email, password } = req.body ?? {};

        if (!email || !password)
        {
            return reply.code(400).send({ error: 'Email and password are required' });
        }

        // Validation renforcée avec le plugin de sécurité
        if (!app.validateEmail(email)) {
            return reply.code(400).send({ error: 'Invalid email address' });
        }

        const passwordValidation = app.validatePassword(password);
        if (!passwordValidation.valid) {
            return reply.code(400).send({ error: passwordValidation.message });
        }

        try
        {
            const user = await UserService.createUser(email, password);
            return reply.code(201).send(user);
        }
        catch (err)
        {
            if (err instanceof DuplicateEmailError)
            {
                return reply.code(409).send({ error: 'Email already in use' });
            }
            if (err && err.message === 'Password too short')
            {
                return reply.code(400).send({ error: err.message });
            }
            
            // Log de l'erreur pour debugging
            app.log.error('Registration error:', err);
            return reply.code(500).send({ error: 'Internal server error' });
        }
    });

    app.post('/login', {
        config: {
            rateLimit: {
                max: 10, // 10 tentatives de connexion
                timeWindow: '15 minutes' // par 15 minutes
            }
        },
        schema: {
            body: {
                type: 'object',
                required: ['email', 'password'],
                additionalProperties: false,
                properties: {
                    email: {
                        type: 'string',
                        format: 'email',
                        maxLength: 254
                    },
                    password: {
                        type: 'string',
                        minLength: 1,
                        maxLength: 128
                    }
                }
            }
        }
    }, async (req, reply) =>
    {
        const { email, password } = req.body ?? {};

        if (!email || !password)
        {
            return reply.code(400).send({ error: 'Email and password are required' });
        }

        // Validation de l'email
        if (!app.validateEmail(email)) {
            return reply.code(400).send({ error: 'Invalid email address' });
        }

        try {
            const user = await UserService.authenticate(email, password);
            if (!user)
            {
                // Log des tentatives de connexion échouées
                app.log.warn({
                    type: 'failed_login',
                    email: email,
                    ip: req.ip,
                    userAgent: req.headers['user-agent']
                }, 'Failed login attempt');
                
                return reply.code(401).send({ error: 'Invalid credentials' });
            }

            // Log des connexions réussies
            app.log.info({
                type: 'successful_login',
                userId: user.id,
                email: user.email,
                ip: req.ip
            }, 'Successful login');

            const token = app.jwt.sign({ 
                sub: user.id, 
                email: user.email,
                iat: Math.floor(Date.now() / 1000), // Issued at
                exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // Expire dans 24h
            });
            
            return reply.send({ token });
        } catch (error) {
            app.log.error('Login error:', error);
            return reply.code(500).send({ error: 'Internal server error' });
        }
    });

    app.get('/protected', { preHandler: [ (req, _res) => req.jwtVerify() ] }, async (_req, reply) =>
    {
        return reply.send({ ok: true });
    });

    app.get('/me', { preHandler: [ (req, _res) => req.jwtVerify() ] }, async (req, reply) =>
    {
        return reply.send({ id: req.user.id, email: req.user.email });
    });
}
