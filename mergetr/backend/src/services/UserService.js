// src/services/UserService.js
import pool from '../config/db.js';
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

        // Générer un username par défaut à partir de l'email
        let username = e.split('@')[0].substring(0, 25); // Laisser de la place pour un suffixe
        
        // Gérer les conflits de username en ajoutant un suffixe numérique
        let attempts = 0;
        let finalUsername = username;
        
        while (attempts < 10) {
            try {
                const { rows } = await pool.query(
                {
                    text:
                        `INSERT INTO users(email, username, password_hash)
                         VALUES ($1, $2, $3)
                         ON CONFLICT (email) DO NOTHING
                         RETURNING id, email, username`,
                    values: [ e, finalUsername, hash ]
                });

                if (!rows[0]) {
                    throw new DuplicateEmailError(e);
                }

                return rows[0];
            } catch (error) {
                if (error.code === '23505' && error.constraint === 'users_username_key') {
                    // Conflit de username, essayer avec un suffixe
                    attempts++;
                    finalUsername = `${username}${attempts}`;
                } else {
                    throw error;
                }
            }
        }
        
        throw new Error('Unable to generate unique username');
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
