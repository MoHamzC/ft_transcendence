import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import FuzzyText from "./FuzzyText";
import TargetCursor from './TargetCursor';
import { use2FA } from './hooks/use2FA';

export default function DoubleAuth() {
    const navigate = useNavigate();
    const location = useLocation();
    const [otpCode, setOtpCode] = useState('');
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
    const { verifyOTP, loading, error, clearError } = use2FA();

    // Récupérer l'email depuis l'état de navigation
    const email = location.state?.email;

    useEffect(() => {
        // Rediriger vers login si pas d'email
        if (!email) {
            navigate('/login');
            return;
        }

        // Décompte de 5 minutes
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setTimeout(() => navigate('/login'), 3000);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [email, navigate]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    async function validateCode() {
        if (!otpCode || otpCode.length !== 6) {
            return;
        }

        clearError();

        try {
            await verifyOTP(email, otpCode);
            // Redirection avec paramètre de succès
            window.location.href = '/?login=success';
        } catch (err) {
            // L'erreur est déjà gérée par le hook
            console.error('OTP verification error:', err);
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        validateCode();
    }

    function goBackToLogin() {
        navigate('/login');
    }

    // Permettre seulement les chiffres et limiter à 6 caractères
    function handleOtpChange(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
        setOtpCode(value);
        clearError(); // Reset error when user types
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem',
            gap: '2rem'
        }}>
            <TargetCursor spinDuration={2} hideDefaultCursor={true} />

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2rem',
                maxWidth: '400px',
                width: '100%'
            }}>
                <h1 className='transcendence cursor-target'>
                    <FuzzyText>Double Authentification</FuzzyText>
                </h1>

                <div style={{ textAlign: 'center', color: '#888' }}>
                    <p>Un code de vérification a été envoyé à :</p>
                    <p style={{ fontWeight: 'bold', color: '#fff' }}>{email}</p>
                    <p style={{ fontSize: '0.9rem', marginTop: '1rem' }}>
                        Temps restant : <span style={{ color: timeLeft < 60 ? '#ff6b6b' : '#4ecdc4' }}>
                            {formatTime(timeLeft)}
                        </span>
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem',
                    width: '100%'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label htmlFor="otp" style={{ color: '#ccc', fontSize: '0.9rem' }}>
                            Code de vérification (6 chiffres)
                        </label>
                        <input
                            id="otp"
                            className="px-4 py-3 rounded text-white cursor-target"
                            style={{
                                backgroundColor: 'oklch(38% 0.189 293.745)',
                                textAlign: 'center',
                                fontSize: '1.5rem',
                                letterSpacing: '0.5rem',
                                fontFamily: 'monospace'
                            }}
                            type="text"
                            placeholder="000000"
                            value={otpCode}
                            onChange={handleOtpChange}
                            maxLength={6}
                            disabled={loading || timeLeft === 0}
                        />
                    </div>

                    {error && (
                        <div style={{
                            color: '#ff6b6b',
                            textAlign: 'center',
                            padding: '0.5rem',
                            backgroundColor: 'rgba(255, 107, 107, 0.1)',
                            borderRadius: '0.5rem',
                            border: '1px solid rgba(255, 107, 107, 0.3)'
                        }}>
                            {error}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                        <button
                            className="px-4 py-3 rounded-full text-white hover:cursor-pointer hover:bg-gray-500 active:scale-95 shadow-xl cursor-target"
                            style={{
                                backgroundColor: loading ? '#666' : 'oklch(25.7% 0.09 281.288)',
                                flex: 1
                            }}
                            type="submit"
                            disabled={loading || otpCode.length !== 6 || timeLeft === 0}
                        >
                            {loading ? 'Vérification...' : 'Valider'}
                        </button>

                        <button
                            className="px-4 py-3 rounded-full text-white hover:cursor-pointer hover:bg-gray-500 active:scale-95 shadow-xl cursor-target"
                            style={{
                                backgroundColor: 'oklch(25.7% 0.09 281.288)',
                                flex: 1
                            }}
                            type="button"
                            onClick={goBackToLogin}
                        >
                            Retour
                        </button>
                    </div>
                </form>

                <div style={{
                    textAlign: 'center',
                    fontSize: '0.8rem',
                    color: '#888',
                    lineHeight: '1.4'
                }}>
                    <p>Vous n'avez pas reçu le code ?</p>
                    <p>Vérifiez votre dossier spam ou reconnectez-vous.</p>
                </div>
            </div>
        </div>
    );
}
