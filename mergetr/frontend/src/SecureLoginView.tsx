import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateEmail, validatePassword, sanitizeInput, checkClientRateLimit } from './utils/validation';

export default function SecureLoginView() {
    const navigate = useNavigate();
    const BACKEND_URL = 'https://localhost:3443'; // HTTPS obligatoire !
    
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    
    const [errors, setErrors] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (field: 'email' | 'password', value: string) => {
        // Sanitisation en temps réel
        const sanitizedValue = sanitizeInput(value);
        setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
        
        // Validation en temps réel
        if (errors.length > 0) {
            validateForm();
        }
    };

    const validateForm = (): boolean => {
        const newErrors: string[] = [];
        
        // Validation email
        const emailValidation = validateEmail(formData.email);
        if (!emailValidation.isValid) {
            newErrors.push(...emailValidation.errors);
        }
        
        // Validation password
        const passwordValidation = validatePassword(formData.password);
        if (!passwordValidation.isValid) {
            newErrors.push(...passwordValidation.errors);
        }
        
        setErrors(newErrors);
        return newErrors.length === 0;
    };

    const handleSecureLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Rate limiting côté client
        if (!checkClientRateLimit('login', 5, 900000)) { // 5 tentatives par 15 min
            setErrors(['Too many login attempts. Please wait 15 minutes.']);
            return;
        }
        
        // Validation
        if (!validateForm()) {
            return;
        }
        
        setIsSubmitting(true);
        setErrors([]);

        try {
            const response = await fetch(`${BACKEND_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Important pour les cookies
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password
                }),
            });

            if (response.ok) {
                await response.json(); // Récupérer la réponse
                // Nettoyer le formulaire
                setFormData({ email: '', password: '' });
                navigate('/');
            } else {
                const error = await response.json();
                setErrors([error.error || 'Login failed']);
            }
        } catch (err) {
            console.error('Login error:', err);
            setErrors(['Network error. Please check your connection.']);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOAuthLogin = (provider: '42' | 'github' | 'google') => {
        // HTTPS obligatoire pour OAuth
        window.location.href = `${BACKEND_URL}/auth/${provider}`;
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white mb-8">
                        🔒 Secure Login
                    </h1>
                </div>

                {/* Erreurs */}
                {errors.length > 0 && (
                    <div className="bg-red-900/50 border border-red-500 rounded-lg p-4">
                        <h3 className="text-red-200 font-semibold mb-2">Validation Errors:</h3>
                        <ul className="text-red-300 text-sm space-y-1">
                            {errors.map((error, index) => (
                                <li key={index}>• {error}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Formulaire sécurisé */}
                <form onSubmit={handleSecureLogin} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                            Email Address *
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            autoComplete="email"
                            maxLength={254}
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="your@email.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                            Password *
                        </label>
                        <input
                            id="password"
                            type="password"
                            required
                            autoComplete="current-password"
                            minLength={12}
                            maxLength={128}
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Minimum 12 characters"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || errors.length > 0}
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200"
                    >
                        {isSubmitting ? '🔄 Connecting...' : '🔑 Login'}
                    </button>
                </form>

                {/* OAuth sécurisé */}
                <div className="space-y-3">
                    <div className="text-center text-gray-400 text-sm">
                        Or continue with
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                        <button 
                            onClick={() => handleOAuthLogin('42')}
                            className="w-full px-4 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg flex items-center justify-center gap-3 transition-colors"
                        >
                            <img src="/assets/42.svg" alt="42" className="w-5 h-5" />
                            École 42
                        </button>
                        
                        <button 
                            onClick={() => handleOAuthLogin('github')}
                            className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center justify-center gap-3 transition-colors"
                        >
                            <img src="/assets/github.svg" alt="GitHub" className="w-5 h-5" />
                            GitHub
                        </button>
                        
                        <button 
                            onClick={() => handleOAuthLogin('google')}
                            className="w-full px-4 py-3 bg-white hover:bg-gray-50 text-gray-800 rounded-lg flex items-center justify-center gap-3 transition-colors"
                        >
                            <img src="/assets/google.svg" alt="Google" className="w-5 h-5" />
                            Google
                        </button>
                    </div>
                </div>

                {/* Retour sécurisé */}
                <div className="text-center">
                    <button 
                        onClick={() => navigate('/')}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        ← Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
}
