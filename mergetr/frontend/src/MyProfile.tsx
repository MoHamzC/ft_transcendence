import ProfileSimple from "./ProfileSimple";
import ProfileErrorBoundary from './ProfileErrorBoundary';
import ProfileDebugOverlay from './ProfileDebugOverlay';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function MyProfile() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const navigate = useNavigate();
    const BACKEND_URL = 'https://localhost:8443';

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

    const handleAnonymize = async () => {
        if (!confirm("Confirmer l'anonymisation de votre compte ? (Action irréversible)")) return;
        try {
            const res = await fetch(`${BACKEND_URL}/api/gdpr/anonymize`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ confirmation: 'I_UNDERSTAND_THIS_IS_IRREVERSIBLE' })
            });
            if (res.ok) {
                alert('Compte anonymisé.');
                navigate('/', { replace: true });
            } else {
                const data = await res.json().catch(() => ({}));
                alert('Erreur anonymisation: ' + (data.error || res.status));
            }
        } catch (e) {
            console.error(e);
            alert('Erreur réseau anonymisation');
        }
    };

    const handleDelete = async () => {
        if (!confirm('Supprimer définitivement votre compte ?')) return;
        try {
            const res = await fetch(`${BACKEND_URL}/api/gdpr/account`, {
                method: 'DELETE',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ confirmation: 'DELETE_MY_ACCOUNT_PERMANENTLY', reason: 'other' })
            });
            if (res.ok) {
                alert('Compte supprimé.');
                navigate('/', { replace: true });
            } else {
                const data = await res.json().catch(() => ({}));
                alert('Erreur suppression: ' + (data.error || res.status));
            }
        } catch (e) {
            console.error(e);
            alert('Erreur réseau suppression');
        }
    };

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
            <div id="profile-root-wrapper" style={{ position: 'relative', paddingTop: '90px', maxHeight: 'calc(100vh - 100px)', overflowY: 'auto', width: '100%', scrollbarWidth: 'thin' }}>
                <ProfileSimple />
                <div style={{
                    marginTop: '2rem',
                    display: 'flex',
                    gap: '1rem',
                    flexWrap: 'wrap'
                }}>
                    <button onClick={handleAnonymize} style={{
                        background: 'linear-gradient(135deg,#f2c94c,#f2994a)',
                        color: '#121212',
                        border: 'none',
                        padding: '0.75rem 1.25rem',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}>
                        Anonymiser mon compte (GDPR)
                    </button>
                    <button onClick={handleDelete} style={{
                        background: 'linear-gradient(135deg,#ff416c,#ff4b2b)',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem 1.25rem',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}>
                        Supprimer mon compte (GDPR)
                    </button>
                </div>
            </div>
            {import.meta.env.DEV && <ProfileDebugOverlay />}
        </ProfileErrorBoundary>
    );
}
