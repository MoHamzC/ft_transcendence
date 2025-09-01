// frontend/src/utils/validation.ts - Validation sécurisée OBLIGATOIRE

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
    
    // Bloquer domaines suspects
    const suspiciousDomains = ['tempmail.org', '10minutemail.com'];
    const domain = email.split('@')[1]?.toLowerCase();
    if (domain && suspiciousDomains.includes(domain)) {
        errors.push('Suspicious email domain not allowed');
    }
    
    return { isValid: errors.length === 0, errors };
};

export const validatePassword = (password: string): ValidationResult => {
    const errors: string[] = [];
    
    if (!password) {
        errors.push('Password required');
    } else if (password.length < 12) {
        errors.push('Password must be 12+ characters');
    } else if (password.length > 128) {
        errors.push('Password too long (max 128 chars)');
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(password)) {
        errors.push('Password must contain: lowercase, uppercase, number, special char');
    }
    
    return { isValid: errors.length === 0, errors };
};

export const sanitizeInput = (input: string): string => {
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};

export const validateUsername = (username: string): ValidationResult => {
    const errors: string[] = [];
    
    if (!username) {
        errors.push('Username required');
    } else if (username.length < 3) {
        errors.push('Username must be at least 3 characters');
    } else if (username.length > 20) {
        errors.push('Username too long (max 20 chars)');
    } else if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        errors.push('Username can only contain letters, numbers, _ and -');
    }
    
    return { isValid: errors.length === 0, errors };
};
