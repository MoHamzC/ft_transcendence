// src/routes/auth.route.js
// Allman

import { UserService, DuplicateEmailError } from '../services/UserService.js';

export default async function authRoutes(app)
{
    app.get('/status', async (_req, reply) =>
    {
        return reply.send({ status: 'Auth module OK' });
    });

    app.post('/register', async (req, reply) =>
    {
        const { email, password } = req.body ?? {};

        if (!email || !password)
        {
            return reply.code(400).send({ error: 'Email and password are required' });
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
        }
    });

    app.post('/login', async (req, reply) =>
    {
        const { email, password } = req.body ?? {};

        if (!email || !password)
        {
            return reply.code(400).send({ error: 'Email and password are required' });
        }

        const user = await UserService.authenticate(email, password);
        if (!user)
        {
            return reply.code(401).send({ error: 'Invalid credentials' });
        }

        const token = app.jwt.sign({ sub: user.id, email: user.email });
        return reply.send({ token });
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
