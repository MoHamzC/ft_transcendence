import { useState } from 'react';

interface LoginResponse {
    step?: string;
    message?: string;
    username?: string;
}

interface Use2FAReturn {
    login: (email: string, password: string) => Promise<LoginResponse>;
    verifyOTP: (email: string, otpCode: string) => Promise<any>;
    loading: boolean;
    error: string | null;
    clearError: () => void;
}

export function use2FA(): Use2FAReturn {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const BACKEND_URL = 'http://localhost:5001';

    const clearError = () => setError(null);

    const login = async (email: string, password: string): Promise<LoginResponse> => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch(`${BACKEND_URL}/api/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || errorData.message || 'Login failed');
            }

            return await response.json();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Network error occurred';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const verifyOTP = async (email: string, otpCode: string) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${BACKEND_URL}/api/users/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ 
                    email: email, 
                    otp_Code: otpCode 
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.Message || errorData.Error || 'Code OTP invalide');
            }

            return await response.json();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Network error occurred';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        login,
        verifyOTP,
        loading,
        error,
        clearError
    };
}
