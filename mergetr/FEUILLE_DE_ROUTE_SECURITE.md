# 🗺️ FEUILLE DE ROUTE - Implémentation Sécurité ft_transcendence

## 📋 MISSION : Sécuriser ft_transcendence pour obtenir 100/100

Cette feuille de route vous guide pour implémenter **TOUTES** les mesures de sécurité obligatoires selon le sujet du projet ft_transcendence.

---

## 🔍 PHASE 1 : AUDIT INITIAL (15-30 min)

### 1.1 Vérifications obligatoires selon le sujet

Vérifiez si ces éléments **OBLIGATOIRES** sont présents :

```bash
# 1. Mots de passe hashés ?
grep -r "bcrypt\|hash" backend/src/ || echo "❌ MANQUE: Hashage mots de passe"

# 2. Protection SQL Injection ?
grep -r "\$[0-9]" backend/src/ || echo "❌ MANQUE: Requêtes paramétrées"

# 3. Protection XSS ?
grep -r "sanitiz\|DOMPurify" backend/src/ || echo "❌ MANQUE: Protection XSS"

# 4. HTTPS obligatoire ?
ls -la | grep -E "(https|ssl|cert)" || echo "❌ MANQUE: HTTPS"

# 5. Validation formulaires ?
grep -r "validation\|schema.*required" backend/src/ || echo "❌ MANQUE: Validation backend"
grep -r "validation" frontend/src/ || echo "❌ MANQUE: Validation frontend"

# 6. Routes protégées ?
grep -r "jwt\|auth\|token" backend/src/ || echo "❌ MANQUE: Protection routes"

# 7. GDPR compliance ?
grep -r "gdpr\|anonymiz\|export.*data" backend/src/ || echo "❌ MANQUE: GDPR compliance"
```

### 1.2 Évaluation de l'existant

Notez ce qui manque et priorisez :
- ❌ **CRITIQUE** : Éléments obligatoires manquants
- ⚠️ **IMPORTANT** : Sécurité partielle
- ✅ **OK** : Déjà implémenté

---

## 🚀 PHASE 2 : INFRASTRUCTURE DE BASE (30-45 min)

### 2.1 Créer le Makefile d'automatisation

```bash
# Créer Makefile à la racine du projet
touch Makefile
```

**Contenu du Makefile** (copier exactement) :

```makefile
# Makefile for ft_transcendence Security Implementation
.PHONY: help install setup security-audit

# Colors
GREEN = \033[0;32m
YELLOW = \033[1;33m
RED = \033[0;31m
NC = \033[0m

help: ## Show available commands
	@echo "$(GREEN)ft_transcendence Security Makefile$(NC)"
	@echo "=================================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "$(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'

install: ## Install all dependencies
	@echo "$(GREEN)📦 Installing dependencies...$(NC)"
	@cd backend && npm ci
	@cd frontend && npm install

setup: ## Initial project setup
	@echo "$(GREEN)🔧 Setting up project...$(NC)"
	@docker-compose up -d db vault
	@sleep 5
	@echo "$(GREEN)✅ Infrastructure ready$(NC)"

security-audit: ## Run security audit
	@echo "$(GREEN)🔍 Running security audit...$(NC)"
	@chmod +x audit-security.sh
	@./audit-security.sh

enable-https: ## Enable HTTPS (MANDATORY)
	@echo "$(GREEN)🔒 Enabling HTTPS...$(NC)"
	@chmod +x enable-https.sh
	@./enable-https.sh

clean: ## Clean everything
	@echo "$(YELLOW)🧹 Cleaning...$(NC)"
	@docker-compose down -v
	@rm -rf node_modules/*/node_modules
```

### 2.2 Créer les scripts de sécurité

```bash
# Script d'audit (créer audit-security.sh)
chmod +x audit-security.sh
```

---

## 🔐 PHASE 3 : SÉCURISATION BACKEND (1-2h)

### 3.1 Installation des dépendances sécurisées

```bash
cd backend
npm install @fastify/helmet @fastify/rate-limit @fastify/cors bcrypt isomorphic-dompurify validator jsonwebtoken
```

### 3.2 Plugin de sécurité centralisé

**Créer** `backend/src/plugins/security.js` :

```javascript
// Plugin de sécurité OBLIGATOIRE pour ft_transcendence
import fp from 'fastify-plugin';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import cors from '@fastify/cors';
import createDOMPurify from 'isomorphic-dompurify';
import validator from 'validator';

const DOMPurify = createDOMPurify();

export default fp(async (app) => {
    // 1. CORS sécurisé
    await app.register(cors, {
        origin: process.env.NODE_ENV === 'development' 
            ? ['http://localhost:5173', 'https://localhost:3443']
            : ['https://your-domain.com'],
        credentials: true
    });

    // 2. Headers de sécurité (OBLIGATOIRE)
    await app.register(helmet, {
        hsts: { maxAge: 31536000, includeSubDomains: true },
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "https:"]
            }
        }
    });

    // 3. Rate Limiting GLOBAL (protection DDoS)
    await app.register(rateLimit, {
        max: 100,
        timeWindow: '1 minute'
    });

    // 4. Rate Limiting AUTH (protection brute force)
    await app.register(rateLimit, {
        max: 10,
        timeWindow: '15 minutes',
        keyGenerator: (request) => request.ip,
        errorResponseBuilder: (request, context) => ({
            error: 'Too many attempts. Try again later.',
            retryAfter: Math.round(context.ttl / 1000)
        })
    }, { name: 'auth-rate-limit' });

    // 5. Sanitisation XSS (OBLIGATOIRE)
    app.addHook('preHandler', async (request, reply) => {
        if (request.body && typeof request.body === 'object') {
            sanitizeObject(request.body);
        }
        if (request.query && typeof request.query === 'object') {
            sanitizeObject(request.query);
        }
    });

    // 6. Validation email renforcée
    app.decorate('validateEmail', (email) => {
        if (!email || typeof email !== 'string') return false;
        if (!validator.isEmail(email)) return false;
        if (email.length > 254) return false;
        
        // Bloquer domaines suspects
        const suspiciousDomains = ['tempmail.org', '10minutemail.com'];
        const domain = email.split('@')[1]?.toLowerCase();
        return !suspiciousDomains.includes(domain);
    });

    // 7. Validation mot de passe STRICTE
    app.decorate('validatePassword', (password) => {
        if (!password || typeof password !== 'string') {
            return { valid: false, message: 'Password required' };
        }
        if (password.length < 12) {
            return { valid: false, message: 'Password must be 12+ characters' };
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(password)) {
            return { valid: false, message: 'Password must contain: lowercase, uppercase, number, special char' };
        }
        return { valid: true };
    });

    app.log.info('✅ Security plugin loaded');
});

// Fonction de sanitisation XSS
function sanitizeObject(obj) {
    for (const key in obj) {
        if (typeof obj[key] === 'string') {
            obj[key] = DOMPurify.sanitize(obj[key]);
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            sanitizeObject(obj[key]);
        }
    }
}
```

### 3.3 Hashage des mots de passe (OBLIGATOIRE)

**Modifier/créer** votre service d'authentification :

```javascript
// backend/src/services/AuthService.js
import bcrypt from 'bcrypt';

export class AuthService {
    static async hashPassword(password) {
        return await bcrypt.hash(password, 12); // 12 rounds MINIMUM
    }

    static async verifyPassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }

    static async createUser(email, password) {
        // TOUJOURS hasher avant stockage
        const hashedPassword = await this.hashPassword(password);
        
        // Requête paramétrée (protection SQL injection)
        const result = await pool.query(
            'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
            [email, hashedPassword]
        );
        
        return result.rows[0];
    }

    static async authenticate(email, password) {
        // Requête paramétrée (protection SQL injection)
        const result = await pool.query(
            'SELECT id, email, password FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) return null;

        const user = result.rows[0];
        const isValid = await this.verifyPassword(password, user.password);
        
        if (!isValid) return null;

        // Retourner sans le mot de passe
        return { id: user.id, email: user.email };
    }
}
```

### 3.4 Routes protégées par JWT (OBLIGATOIRE)

**Créer** `backend/src/plugins/jwt.js` :

```javascript
import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';

export default fp(async (app) => {
    await app.register(jwt, {
        secret: process.env.JWT_SECRET || 'super-secret-key-change-in-production'
    });

    // Middleware de protection
    app.decorate('authenticate', async (request, reply) => {
        try {
            await request.jwtVerify();
        } catch (err) {
            reply.code(401).send({ error: 'Authentication required' });
        }
    });

    app.log.info('✅ JWT plugin loaded');
});
```

---

## 🔒 PHASE 4 : HTTPS OBLIGATOIRE (30-45 min)

### 4.1 Serveur HTTPS

**Créer** `backend/src/server-https.js` :

```javascript
import 'dotenv/config';
import Fastify from 'fastify';
import { readFileSync } from 'fs';
import { join } from 'path';
import securityPlugin from './plugins/security.js';
import jwtPlugin from './plugins/jwt.js';
import { registerRoutes } from './routes/index.js';

async function start() {
    // Configuration HTTPS (OBLIGATOIRE)
    const httpsOptions = {
        key: readFileSync(join(process.cwd(), '..', 'ssl', 'key.pem')),
        cert: readFileSync(join(process.cwd(), '..', 'ssl', 'cert.pem'))
    };

    const app = Fastify({ 
        logger: true,
        https: httpsOptions // HTTPS OBLIGATOIRE
    });

    // 1. Sécurité en premier
    await app.register(securityPlugin);
    
    // 2. JWT
    await app.register(jwtPlugin);
    
    // 3. Routes
    await registerRoutes(app);

    const port = Number(process.env.HTTPS_PORT ?? 3443);
    await app.listen({ host: '0.0.0.0', port });
    app.log.info(`🔒 HTTPS server: https://localhost:${port}`);
}

start().catch(console.error);
```

### 4.2 Script d'activation HTTPS

**Créer** `enable-https.sh` :

```bash
#!/bin/bash
set -e

echo "🔒 Enabling HTTPS (MANDATORY for ft_transcendence)"

# Générer certificats SSL
mkdir -p ssl
cd ssl

if [ ! -f "key.pem" ]; then
    openssl genrsa -out key.pem 2048
    openssl req -new -x509 -key key.pem -out cert.pem -days 365 \
        -subj "/C=FR/ST=France/L=Paris/O=42School/CN=localhost" -batch
    echo "✅ SSL certificates generated"
fi

cd ..

# Démarrer HTTPS
echo "🚀 Starting HTTPS server..."
cd backend

export HTTPS_PORT=3443
export NODE_ENV=development

node src/server-https.js
```

---

## 🌐 PHASE 5 : SÉCURISATION FRONTEND (45-60 min)

### 5.1 Utilitaires de validation

**Créer** `frontend/src/utils/validation.ts` :

```typescript
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

export const validateEmail = (email: string): ValidationResult => {
    const errors: string[] = [];
    
    if (!email) {
        errors.push('Email required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Invalid email format');
    } else if (email.length > 254) {
        errors.push('Email too long');
    }
    
    return { isValid: errors.length === 0, errors };
};

export const validatePassword = (password: string): ValidationResult => {
    const errors: string[] = [];
    
    if (!password) {
        errors.push('Password required');
    } else if (password.length < 12) {
        errors.push('Password must be 12+ characters');
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(password)) {
        errors.push('Password must contain: lowercase, uppercase, number, special char');
    }
    
    return { isValid: errors.length === 0, errors };
};

export const sanitizeInput = (input: string): string => {
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
};
```

### 5.2 Composant Login sécurisé

**Créer** `frontend/src/SecureLoginView.tsx` :

```typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateEmail, validatePassword, sanitizeInput } from './utils/validation';

export default function SecureLoginView() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (field: 'email' | 'password', value: string) => {
        const sanitizedValue = sanitizeInput(value);
        setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
    };

    const validateForm = (): boolean => {
        const newErrors: string[] = [];
        
        const emailValidation = validateEmail(formData.email);
        if (!emailValidation.isValid) {
            newErrors.push(...emailValidation.errors);
        }
        
        const passwordValidation = validatePassword(formData.password);
        if (!passwordValidation.isValid) {
            newErrors.push(...passwordValidation.errors);
        }
        
        setErrors(newErrors);
        return newErrors.length === 0;
    };

    const handleSecureLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        setIsSubmitting(true);
        
        try {
            const response = await fetch('https://localhost:3443/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                navigate('/');
            } else {
                const error = await response.json();
                setErrors([error.error || 'Login failed']);
            }
        } catch (err) {
            setErrors(['Network error']);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center">
            <form onSubmit={handleSecureLogin} className="space-y-4 max-w-md w-full">
                <h1 className="text-2xl font-bold text-center">🔒 Secure Login</h1>
                
                {errors.length > 0 && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {errors.map((error, i) => <div key={i}>{error}</div>)}
                    </div>
                )}
                
                <input
                    type="email"
                    placeholder="Email"
                    required
                    maxLength={254}
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                />
                
                <input
                    type="password"
                    placeholder="Password (12+ chars)"
                    required
                    minLength={12}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                />
                
                <button
                    type="submit"
                    disabled={isSubmitting || errors.length > 0}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded disabled:bg-gray-400"
                >
                    {isSubmitting ? 'Connecting...' : 'Login'}
                </button>
            </form>
        </div>
    );
}
```

---

## 🏛️ PHASE 6 : MODULE GDPR OBLIGATOIRE (45-60 min)

### 6.1 Service GDPR complet

**Créer** `backend/src/services/GDPRService.js` :

```javascript
// backend/src/services/GDPRService.js - Conformité GDPR obligatoire
import pool from '../config/db.js';

export class GDPRService {
    // Anonymisation utilisateur (GDPR Art. 17)
    static async anonymizeUser(userId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Anonymiser données personnelles
            await client.query(`
                UPDATE users 
                SET 
                    email = 'anonymized_' || id || '@deleted.local',
                    username = 'anonymized_user_' || id,
                    first_name = NULL,
                    last_name = NULL,
                    anonymized_at = NOW(),
                    gdpr_status = 'anonymized'
                WHERE id = $1
            `, [userId]);
            
            await client.query('COMMIT');
            return { success: true, message: 'User anonymized' };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
    
    // Export données (GDPR Art. 15)
    static async exportUserData(userId) {
        const userResult = await pool.query(`
            SELECT id, email, username, created_at
            FROM users WHERE id = $1 AND deleted_at IS NULL
        `, [userId]);
        
        if (userResult.rows.length === 0) {
            throw new Error('User not found');
        }
        
        return {
            export_info: {
                generated_at: new Date().toISOString(),
                user_id: userId,
                export_type: 'GDPR_Article_15_Data_Export'
            },
            personal_data: {
                profile: userResult.rows[0]
            },
            gdpr_rights: {
                right_to_access: "Article 15 - Droit d'accès",
                right_to_erasure: "Article 17 - Droit à l'effacement"
            }
        };
    }
    
    // Suppression compte (GDPR Art. 17)
    static async deleteAccount(userId) {
        await this.anonymizeUser(userId);
        
        await pool.query(`
            UPDATE users 
            SET deleted_at = NOW(), gdpr_status = 'deleted'
            WHERE id = $1
        `, [userId]);
        
        return { success: true, message: 'Account deleted' };
    }
}
```

### 6.2 Routes GDPR

**Créer** `backend/src/routes/gdpr.route.js` :

```javascript
// backend/src/routes/gdpr.route.js
import { GDPRService } from '../services/GDPRService.js';
import pool from '../config/db.js';

export default async function gdprRoutes(app) {
    
    // Export données (Article 15)
    app.get('/export', {
        preHandler: [app.authenticate]
    }, async (request, reply) => {
        try {
            const userId = request.user.sub || request.user.id;
            const exportData = await GDPRService.exportUserData(userId);
            
            reply.header('Content-Disposition', 
                `attachment; filename="gdpr_export_${userId}.json"`);
            return exportData;
        } catch (error) {
            return reply.code(500).send({ error: 'Export failed' });
        }
    });
    
    // Anonymisation (Article 17)
    app.post('/anonymize', {
        preHandler: [app.authenticate],
        schema: {
            body: {
                type: 'object',
                required: ['confirmation'],
                properties: {
                    confirmation: { 
                        type: 'string',
                        enum: ['I_UNDERSTAND_THIS_IS_IRREVERSIBLE']
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const userId = request.user.sub || request.user.id;
            const result = await GDPRService.anonymizeUser(userId);
            
            app.log.warn(`User ${userId} anonymized under GDPR Article 17`);
            return result;
        } catch (error) {
            return reply.code(500).send({ error: 'Anonymization failed' });
        }
    });
    
    // Suppression compte (Article 17)
    app.delete('/account', {
        preHandler: [app.authenticate],
        schema: {
            body: {
                type: 'object',
                required: ['confirmation'],
                properties: {
                    confirmation: { 
                        type: 'string',
                        enum: ['DELETE_MY_ACCOUNT_PERMANENTLY']
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const userId = request.user.sub || request.user.id;
            const result = await GDPRService.deleteAccount(userId);
            
            app.log.warn(`Account ${userId} deleted under GDPR Article 17`);
            return result;
        } catch (error) {
            return reply.code(500).send({ error: 'Account deletion failed' });
        }
    });
    
    app.log.info('✅ GDPR routes loaded (Articles 15, 17)');
}
```

### 6.3 Schéma base de données GDPR

**Créer** `backend/src/db/gdpr-schema.sql` :

```sql
-- Extensions GDPR pour la table users
ALTER TABLE users ADD COLUMN IF NOT EXISTS gdpr_consent BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gdpr_consent_date TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS anonymized_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gdpr_status VARCHAR(20) DEFAULT 'active';

-- Table audit GDPR
CREATE TABLE IF NOT EXISTS gdpr_audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(50) NOT NULL, -- 'export', 'anonymize', 'delete'
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_users_gdpr_status ON users(gdpr_status);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

-- Vue utilisateurs actifs
CREATE OR REPLACE VIEW active_users AS
SELECT * FROM users 
WHERE deleted_at IS NULL AND gdpr_status = 'active';
```

### 6.4 Interface utilisateur GDPR

**Créer** `frontend/src/GDPRSettings.tsx` :

```typescript
// frontend/src/GDPRSettings.tsx
import { useState } from 'react';

export default function GDPRSettings() {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    
    const handleExportData = async () => {
        try {
            const response = await fetch('https://localhost:3443/api/gdpr/export', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `gdpr_export_${Date.now()}.json`;
                a.click();
                alert('✅ Données exportées !');
            }
        } catch (error) {
            alert('❌ Erreur export');
        }
    };
    
    const handleAnonymizeAccount = async () => {
        try {
            const response = await fetch('https://localhost:3443/api/gdpr/anonymize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ 
                    confirmation: 'I_UNDERSTAND_THIS_IS_IRREVERSIBLE' 
                })
            });
            
            if (response.ok) {
                alert('✅ Compte anonymisé !');
                window.location.href = '/';
            }
        } catch (error) {
            alert('❌ Erreur anonymisation');
        }
    };
    
    const handleDeleteAccount = async () => {
        try {
            const response = await fetch('https://localhost:3443/api/gdpr/account', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ 
                    confirmation: 'DELETE_MY_ACCOUNT_PERMANENTLY'
                })
            });
            
            if (response.ok) {
                alert('✅ Compte supprimé !');
                window.location.href = '/';
            }
        } catch (error) {
            alert('❌ Erreur suppression');
        }
    };
    
    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">🔒 Paramètres GDPR</h1>
            
            {/* Export données */}
            <div className="mb-6 p-4 border rounded">
                <h3 className="text-lg font-semibold mb-2">📊 Droit d'accès (Article 15)</h3>
                <p className="mb-4">Exportez toutes vos données personnelles.</p>
                <button 
                    onClick={handleExportData}
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                    📥 Exporter mes données
                </button>
            </div>
            
            {/* Anonymisation */}
            <div className="mb-6 p-4 border rounded">
                <h3 className="text-lg font-semibold mb-2">👤 Anonymisation</h3>
                <p className="mb-4">Anonymise vos données personnelles.</p>
                <button 
                    onClick={handleAnonymizeAccount}
                    className="px-4 py-2 bg-yellow-600 text-white rounded"
                >
                    🔒 Anonymiser mon compte
                </button>
            </div>
            
            {/* Suppression */}
            <div className="p-4 border rounded border-red-200 bg-red-50">
                <h3 className="text-lg font-semibold mb-2 text-red-800">
                    🗑️ Droit à l'effacement (Article 17)
                </h3>
                <p className="text-red-700 mb-4">
                    ⚠️ Action irréversible !
                </p>
                <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded"
                >
                    🗑️ Supprimer mon compte
                </button>
            </div>
            
            {/* Modal confirmation */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded max-w-md">
                        <h3 className="text-xl font-bold mb-4">⚠️ Confirmer la suppression</h3>
                        <p className="mb-4">Cette action est irréversible !</p>
                        <div className="flex space-x-3">
                            <button 
                                onClick={handleDeleteAccount}
                                className="px-4 py-2 bg-red-600 text-white rounded"
                            >
                                Supprimer définitivement
                            </button>
                            <button 
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 bg-gray-600 text-white rounded"
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
```

### 6.5 Enregistrer les routes GDPR

**Modifier** `backend/src/routes/index.js` :

```javascript
// Ajouter l'import
import gdprRoutes from './gdpr.route.js';

// Ajouter dans registerRoutes()
app.register(gdprRoutes, { prefix: '/api/gdpr' });
```

---

## 🧪 PHASE 7 : TESTS ET VALIDATION (15-30 min)

### 7.1 Script d'audit automatique

**Créer** `audit-security.sh` :

```bash
#!/bin/bash

echo "🔍 SECURITY AUDIT ft_transcendence"
echo "================================="

SCORE=0
TOTAL=9

# Test 1: Mots de passe hashés
if grep -r "bcrypt.hash" backend/src/ > /dev/null; then
    echo "✅ Password hashing (bcrypt)"
    ((SCORE++))
else
    echo "❌ Missing password hashing"
fi

# Test 2: SQL Injection protection
if grep -r "\$[0-9]" backend/src/ > /dev/null; then
    echo "✅ SQL Injection protection"
    ((SCORE++))
else
    echo "❌ Missing SQL protection"
fi

# Test 3: XSS Protection
if grep -r "DOMPurify\|sanitize" backend/src/ > /dev/null; then
    echo "✅ XSS Protection"
    ((SCORE++))
else
    echo "❌ Missing XSS protection"
fi

# Test 4: HTTPS
if [ -f "backend/src/server-https.js" ]; then
    echo "✅ HTTPS implemented"
    ((SCORE++))
else
    echo "❌ HTTPS missing"
fi

# Test 5: Backend validation
if grep -r "validateEmail\|validatePassword" backend/src/ > /dev/null; then
    echo "✅ Backend validation"
    ((SCORE++))
else
    echo "❌ Missing backend validation"
fi

# Test 6: Frontend validation
if grep -r "validateEmail\|ValidationResult" frontend/src/ > /dev/null; then
    echo "✅ Frontend validation"
    ((SCORE++))
else
    echo "❌ Missing frontend validation"
fi

# Test 7: JWT Protection
if grep -r "jwtVerify\|authenticate" backend/src/ > /dev/null; then
    echo "✅ JWT Protection"
    ((SCORE++))
else
    echo "❌ Missing JWT protection"
fi

# Test 8: Rate Limiting
if grep -r "rate-limit\|rateLimit" backend/src/ > /dev/null; then
    echo "✅ Rate Limiting"
    ((SCORE++))
else
    echo "❌ Missing rate limiting"
fi

# Test 9: GDPR Compliance
if grep -r "GDPRService\|gdpr.*export\|anonymize" backend/src/ > /dev/null; then
    echo "✅ GDPR Compliance"
    ((SCORE++))
else
    echo "❌ Missing GDPR compliance"
fi

echo ""
echo "📊 FINAL SCORE: $SCORE/$TOTAL ($(($SCORE * 100 / $TOTAL))%)"

if [ $SCORE -eq $TOTAL ]; then
    echo "🎉 ALL MANDATORY REQUIREMENTS MET!"
else
    echo "⚠️  Missing $(($TOTAL - $SCORE)) requirements"
fi
```

### 6.2 Tests de fonctionnement

```bash
# Rendre les scripts exécutables
chmod +x audit-security.sh
chmod +x enable-https.sh

# Lancer l'audit
./audit-security.sh

# Tester HTTPS
make enable-https

# Dans un autre terminal, tester
curl -k https://localhost:3443/healthz
```

---

## 📋 PHASE 7 : CHECKLIST FINALE (10 min)

### ✅ Vérifications obligatoires

Cochez TOUS ces éléments :

- [ ] **Mots de passe hashés** avec bcrypt (12+ rounds)
- [ ] **Protection SQL Injection** (requêtes paramétrées uniquement)
- [ ] **Protection XSS** (sanitisation avec DOMPurify)
- [ ] **HTTPS obligatoire** (serveur HTTPS fonctionnel)
- [ ] **Validation backend** (email, password, inputs)
- [ ] **Validation frontend** (validation stricte côté client)
- [ ] **Routes protégées** (JWT + middleware auth)
- [ ] **Rate limiting** (protection brute force et DDoS)

### 🎯 Score final attendu : 100%

Lancez l'audit final :
```bash
./audit-security.sh
```

**RÉSULTAT ATTENDU :**
```
📊 FINAL SCORE: 8/8 (100%)
🎉 ALL MANDATORY REQUIREMENTS MET!
```

---

## 🚨 ERREURS COURANTES À ÉVITER

1. **Mots de passe en clair** → TOUJOURS hasher avec bcrypt
2. **Concaténation SQL** → TOUJOURS utiliser des requêtes paramétrées
3. **Pas de sanitisation** → TOUJOURS nettoyer les inputs
4. **HTTP au lieu d'HTTPS** → HTTPS OBLIGATOIRE selon le sujet
5. **Validation côté serveur uniquement** → Validation côté client ET serveur
6. **Routes ouvertes** → TOUJOURS protéger avec JWT
7. **Pas de rate limiting** → Protection contre brute force OBLIGATOIRE

---

## 🔧 COMMANDES ESSENTIELLES

```bash
# Installation complète
make install

# Setup infrastructure
make setup

# Activer HTTPS (OBLIGATOIRE)
make enable-https

# Audit sécurité
make security-audit

# Aide
make help
```

---

## 📞 EN CAS DE PROBLÈME

Si le score n'est pas 100% :

1. **Relire le sujet** → Vérifier les exigences manquées
2. **Relancer l'audit** → `./audit-security.sh`
3. **Vérifier les logs** → Erreurs dans les terminaux
4. **Tester manuellement** → `curl -k https://localhost:3443/healthz`

**Objectif final : SCORE 8/8 (100%) pour respecter TOUTES les exigences du sujet ft_transcendence.**

---

*Cette feuille de route garantit la conformité avec TOUTES les exigences de sécurité obligatoires du sujet ft_transcendence. Suivez-la étape par étape pour un succès assuré !* 🎯
