import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook React pour gérer le statut en ligne des amis
 * Compatible avec Fastify backend
 */
export const useFriendsStatus = () => {
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Refs pour les intervalles
    const heartbeatInterval = useRef(null);
    const statusInterval = useRef(null);
    const isActiveRef = useRef(true);

    // Fonction pour récupérer le token d'authentification
    const getAuthToken = useCallback(() => {
        return localStorage.getItem('token') || sessionStorage.getItem('token');
    }, []);

    // Fonction pour faire les requêtes avec authentification
    const authenticatedFetch = useCallback(async (url, options = {}) => {
        const token = getAuthToken();
        
        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers
            }
        };

        const response = await fetch(url, config);
        
        if (!response.ok) {
            if (response.status === 401) {
                // Token expiré ou invalide
                localStorage.removeItem('token');
                sessionStorage.removeItem('token');
                throw new Error('Session expirée, veuillez vous reconnecter');
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response;
    }, [getAuthToken]);

    // Envoyer le heartbeat pour signaler l'activité
    const sendHeartbeat = useCallback(async () => {
        if (!isActiveRef.current) return;
        
        try {
            await authenticatedFetch('/api/heartbeat', {
                method: 'POST'
            });
        } catch (err) {
            console.error('Heartbeat failed:', err);
            // Ne pas afficher d'erreur pour le heartbeat, c'est silencieux
        }
    }, [authenticatedFetch]);

    // Récupérer le statut des amis
    const fetchFriendsStatus = useCallback(async () => {
        if (!isActiveRef.current) return;
        
        try {
            setLoading(true);
            
            const response = await authenticatedFetch('/api/friends');
            const data = await response.json();
            
            setFriends(data.friends || []);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch friends status:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [authenticatedFetch]);

    // Marquer comme offline lors de la déconnexion
    const setOfflineStatus = useCallback(async () => {
        try {
            await authenticatedFetch('/api/logout-status', {
                method: 'POST'
            });
        } catch (err) {
            console.error('Failed to set offline status:', err);
        }
    }, [authenticatedFetch]);

    // Démarrer le monitoring
    const startMonitoring = useCallback(() => {
        if (!isActiveRef.current) return;
        
        // Nettoyer les anciens intervalles
        if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
        if (statusInterval.current) clearInterval(statusInterval.current);

        // Premier appel immédiat
        sendHeartbeat();
        fetchFriendsStatus();

        // Heartbeat toutes les 2 minutes
        heartbeatInterval.current = setInterval(sendHeartbeat, 120000);

        // Rafraîchir le statut des amis toutes les 30 secondes
        statusInterval.current = setInterval(fetchFriendsStatus, 30000);
    }, [sendHeartbeat, fetchFriendsStatus]);

    // Arrêter le monitoring
    const stopMonitoring = useCallback(() => {
        if (heartbeatInterval.current) {
            clearInterval(heartbeatInterval.current);
            heartbeatInterval.current = null;
        }
        if (statusInterval.current) {
            clearInterval(statusInterval.current);
            statusInterval.current = null;
        }
    }, []);

    // Gérer la visibilité de la page
    useEffect(() => {
        const handleVisibilityChange = () => {
            const isVisible = !document.hidden;
            isActiveRef.current = isVisible;
            
            if (isVisible) {
                // Page visible - reprendre le monitoring
                startMonitoring();
            } else {
                // Page cachée - arrêter le monitoring
                stopMonitoring();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [startMonitoring, stopMonitoring]);

    // Gérer la fermeture de la page/onglet
    useEffect(() => {
        const handleBeforeUnload = () => {
            // Tentative de signaler qu'on part (peut ne pas fonctionner selon le navigateur)
            navigator.sendBeacon && navigator.sendBeacon('/api/logout-status', 
                JSON.stringify({ action: 'logout' }));
        };

        const handleUnload = () => {
            setOfflineStatus();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('unload', handleUnload);
        
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('unload', handleUnload);
        };
    }, [setOfflineStatus]);

    // Démarrer le monitoring au montage du composant
    useEffect(() => {
        const token = getAuthToken();
        
        if (token) {
            isActiveRef.current = true;
            startMonitoring();
        } else {
            setError('Non connecté');
            setLoading(false);
        }

        // Nettoyage au démontage
        return () => {
            isActiveRef.current = false;
            stopMonitoring();
            setOfflineStatus();
        };
    }, [startMonitoring, stopMonitoring, setOfflineStatus, getAuthToken]);

    // Fonction pour rafraîchir manuellement
    const refreshStatus = useCallback(() => {
        fetchFriendsStatus();
    }, [fetchFriendsStatus]);

    // Fonction pour formater la dernière activité
    const formatLastSeen = useCallback((lastSeen) => {
        if (!lastSeen) return "Jamais vu";
        
        const diff = Date.now() - new Date(lastSeen).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return "À l'instant";
        if (minutes < 5) return "Il y a quelques instants";
        if (minutes < 60) return `Il y a ${minutes}min`;
        if (hours < 24) return `Il y a ${hours}h`;
        if (days === 1) return "Hier";
        return `Il y a ${days} jours`;
    }, []);

    return {
        friends,
        loading,
        error,
        refreshStatus,
        formatLastSeen,
        sendHeartbeat,
        isMonitoring: !!heartbeatInterval.current
    };
};
