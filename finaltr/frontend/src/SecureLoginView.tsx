// frontend/src/SecureLoginView.tsx - Login sécurisé OBLIGATOIRE
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
        // Clear errors when user types
        if (errors.length > 0) {
            setErrors([]);
        }
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
            // Force HTTPS pour la sécurité
            const protocol = window.location.protocol === 'https:' ? 'https' : 'https';
            const response = await fetch(`${protocol}://localhost:3443/api/auth/login`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest' // Protection CSRF
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Login successful:', data);
                navigate('/dashboard');
            } else {
                const errorData = await response.json();
                setErrors([errorData.error || 'Login failed']);
            }
        } catch (err) {
            console.error('❌ Login error:', err);
            setErrors(['Network error - Please check your connection']);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full space-y-8 p-8">
                <div>
                    <h1 className="text-3xl font-bold text-center mb-2">🔒 Secure Login</h1>
                    <p className="text-center text-gray-600">ft_transcendence - Connexion sécurisée</p>
                </div>
                
                <form onSubmit={handleSecureLogin} className="space-y-6">
                    {errors.length > 0 && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            <ul className="list-disc list-inside">
                                {errors.map((error, i) => (
                                    <li key={i}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            📧 Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            placeholder="votre.email@exemple.com"
                            required
                            maxLength={254}
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={isSubmitting}
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            🔐 Mot de passe
                        </label>
                        <input
                            id="password"
                            type="password"
                            placeholder="Minimum 12 caractères avec complexité"
                            required
                            minLength={12}
                            maxLength={128}
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={isSubmitting}
                        />
                        <div className="mt-1 text-xs text-gray-500">
                            Doit contenir: minuscule, majuscule, chiffre, caractère spécial
                        </div>
                    </div>
                    
                    <button
                        type="submit"
                        disabled={isSubmitting || errors.length > 0}
                        className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Connexion en cours...
                            </span>
                        ) : (
                            '🔒 Se connecter de manière sécurisée'
                        )}
                    </button>
                </form>
                
                <div className="text-center">
                    <p className="text-sm text-gray-600">
                        Pas encore de compte ? 
                        <a href="/register" className="font-medium text-blue-600 hover:text-blue-500 ml-1">
                            Créer un compte sécurisé
                        </a>
                    </p>
                </div>
                
                <div className="text-center">
                    <div className="text-xs text-gray-500 border-t pt-4">
                        🛡️ Connexion protégée par HTTPS, JWT et validation renforcée<br />
                        🔐 Mots de passe hashés avec bcrypt (12 rounds)<br />
                        🚫 Protection XSS, SQL Injection et Rate Limiting
                    </div>
                </div>
            </div>
        </div>
    );
}
