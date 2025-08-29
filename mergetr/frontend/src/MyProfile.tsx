import ProfileSimple from "./ProfileSimple";
import ProfileErrorBoundary from './ProfileErrorBoundary';
import ProfileDebugOverlay from './ProfileDebugOverlay';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function MyProfile() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const navigate = useNavigate();
    const BACKEND_URL = 'http://localhost:5001';

    useEffect(() => {
        console.log('[MyProfile] mount');

        const checkAuth = async () => {
            try {
                const response = await fetch(`${BACKEND_URL}/api/users/protected`, {
                    method: 'GET',
                    credentials: 'include',
                });

                if (response.ok) {
                    setIsAuthenticated(true);
                } else {
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error('Auth check error:', error);
                setIsAuthenticated(false);
            }
        };

        checkAuth();

        return () => console.log('[MyProfile] unmount');
    }, []);

    // Rendu conditionnel selon auth
    if (isAuthenticated === null) {
        return (
            <div className="profile-container">
                <div className="profile-content">
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                        <p>Vérification de l'authentification...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="profile-container">
                <div className="profile-content">
                    <div style={{
                        textAlign: 'center',
                        padding: '3rem 2rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '20px',
                        margin: '2rem auto',
                        maxWidth: '500px'
                    }}>
                        <h2 style={{ color: '#ff6b9d', marginBottom: '1rem' }}>
                            🔒 Accès non autorisé
                        </h2>
                        <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '2rem' }}>
                            Vous devez être connecté pour accéder à votre profil.
                        </p>
                        <button
                            onClick={() => navigate('/login', { replace: true })}
                            style={{
                                background: 'linear-gradient(135deg, #ff6b9d, #c942ff)',
                                color: 'white',
                                border: 'none',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                fontWeight: 'bold'
                            }}
                        >
                            Se connecter
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <ProfileErrorBoundary>
            <div id="profile-root-wrapper">
                <ProfileSimple />
            </div>
            {import.meta.env.DEV && <ProfileDebugOverlay />}
        </ProfileErrorBoundary>
    );
}
