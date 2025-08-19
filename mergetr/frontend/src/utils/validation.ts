// utils/validation.ts - Validation côté client
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!email) {
    errors.push('Email is required');
  } else if (email.length > 254) {
    errors.push('Email too long (max 254 characters)');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Invalid email format');
  }
  
  // Bloquer domaines suspects
  const suspiciousDomains = ['tempmail.org', '10minutemail.com', 'guerrillamail.com'];
  const domain = email.split('@')[1]?.toLowerCase();
  if (domain && suspiciousDomains.includes(domain)) {
    errors.push('Temporary email addresses are not allowed');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!password) {
    errors.push('Password is required');
  } else {
    if (password.length < 12) {
      errors.push('Password must be at least 12 characters long');
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    if (password.length > 128) {
      errors.push('Password too long (max 128 characters)');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateUsername = (username: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!username) {
    errors.push('Username is required');
  } else if (username.length < 3) {
    errors.push('Username must be at least 3 characters long');
  } else if (username.length > 30) {
    errors.push('Username too long (max 30 characters)');
  } else if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, underscore and dash');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Sanitisation XSS côté client
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Rate limiting côté client (basique)
const requestTimestamps: Map<string, number[]> = new Map();

export const checkClientRateLimit = (endpoint: string, maxRequests: number = 5, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const timestamps = requestTimestamps.get(endpoint) || [];
  
  // Nettoyer les anciens timestamps
  const validTimestamps = timestamps.filter(time => now - time < windowMs);
  
  if (validTimestamps.length >= maxRequests) {
    return false; // Rate limit atteint
  }
  
  validTimestamps.push(now);
  requestTimestamps.set(endpoint, validTimestamps);
  return true;
};
