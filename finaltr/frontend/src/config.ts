// Configuration centralisée pour les URLs backend
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

// En production avec nginx, utiliser des URLs relatives
// En développement, utiliser l'URL complète avec le port
export const getBackendUrl = () => {
  // Si on est en mode production ou si VITE_BACKEND_URL est vide, utiliser des URLs relatives
  if (import.meta.env.PROD || !import.meta.env.VITE_BACKEND_URL) {
    return '';
  }
  // Sinon utiliser l'URL spécifiée
  return import.meta.env.VITE_BACKEND_URL;
};
