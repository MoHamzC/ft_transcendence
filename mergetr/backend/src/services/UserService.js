// src/services/UserService.js
import { pool } from '../db/pgClient.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = Number(process.env.SALT_ROUNDS ?? 10);

export class DuplicateEmailError extends Error
{
    constructor(email)
    {
        super('Email already in use');
        this.name = 'DuplicateEmailError';
        this.email = email;
    }
}

function normalizeEmail(email)
{
    return String(email ?? '').trim().toLowerCase();
}

export class UserService
{
    static async findByEmailForAuth(email)
    {
        const e = normalizeEmail(email);

        const { rows } = await pool.query(
        {
            text: 'SELECT id, email, password_hash FROM users WHERE email = $1',
            values: [ e ]
        });
        return rows[0] ?? null;
    }

    static async findPublicById(id)
    {
        const { rows } = await pool.query(
        {
            text: 'SELECT id, email FROM users WHERE id = $1',
            values: [ id ]
        });
        return rows[0] ?? null;
    }

    static async createUser(email, password)
    {
        const e = normalizeEmail(email);

        if (!password || password.length < 8)
        {
            throw new Error('Password too short');
        }

        const hash = await bcrypt.hash(password, SALT_ROUNDS);

        const { rows } = await pool.query(
        {
            text:
                `INSERT INTO users(email, password_hash)
                 VALUES ($1,$2)
                 ON CONFLICT (email) DO NOTHING
                 RETURNING id, email`,
            values: [ e, hash ]
        });

        if (!rows[0])
        {
            throw new DuplicateEmailError(e);
        }

        return rows[0];
    }

    static async authenticate(email, password)
    {
        const user = await this.findByEmailForAuth(email);
        if (!user)
        {
            return null;
        }

        const ok = await bcrypt.compare(password, user.password_hash);
        return ok ? { id: user.id, email: user.email } : null;
    }
}
