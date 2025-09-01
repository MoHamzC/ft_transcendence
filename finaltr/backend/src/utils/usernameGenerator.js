import pool from '../config/db.js';

/**
 * Vérifie si un username existe déjà dans la base de données
 * @param {string} username - Le nom d'utilisateur à vérifier
 * @returns {boolean} - true si le username existe, false sinon
 */
async function checkUsernameExists(username) {
    try {
        const result = await pool.query(
            'SELECT username FROM users WHERE username = $1',
            [username]
        );
        return result.rows.length > 0;
    } catch (error) {
        console.error('Erreur lors de la vérification du username:', error);
        throw error;
    }
}

/**
 * Génère un username unique en ajoutant un suffixe numérique si nécessaire
 * @param {string} baseUsername - Le nom d'utilisateur de base
 * @returns {string} - Un nom d'utilisateur unique
 */
async function generateUniqueUsername(baseUsername) {
    try {
        // Nettoyer le username de base (enlever les espaces, caractères spéciaux)
        let cleanUsername = baseUsername
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '') // Garder seulement lettres, chiffres et underscore
            .substring(0, 20); // Limiter à 20 caractères

        // Si le username est vide après nettoyage, utiliser un nom par défaut
        if (!cleanUsername) {
            cleanUsername = 'user';
        }

        // Vérifier si le username de base est disponible
        const exists = await checkUsernameExists(cleanUsername);
        if (!exists) {
            console.log(`✅ Username '${cleanUsername}' disponible`);
            return cleanUsername;
        }

        // Si le username existe déjà, essayer avec des suffixes numériques
        let counter = 1;
        let uniqueUsername = `${cleanUsername}${counter}`;

        while (await checkUsernameExists(uniqueUsername)) {
            counter++;
            uniqueUsername = `${cleanUsername}${counter}`;

            // Sécurité : éviter une boucle infinie
            if (counter > 9999) {
                // Ajouter un timestamp comme dernier recours
                const timestamp = Date.now().toString().slice(-4);
                uniqueUsername = `${cleanUsername.substring(0, 15)}${timestamp}`;
                break;
            }
        }

        console.log(`✅ Username unique généré: '${uniqueUsername}' (original: '${baseUsername}')`);
        return uniqueUsername;

    } catch (error) {
        console.error('Erreur lors de la génération du username unique:', error);
        // En cas d'erreur, retourner un username avec timestamp
        const fallback = `user${Date.now().toString().slice(-6)}`;
        console.log(`⚠️  Username de secours utilisé: '${fallback}'`);
        return fallback;
    }
}

/**
 * Valide si un username respecte les critères
 * @param {string} username - Le nom d'utilisateur à valider
 * @returns {object} - {isValid: boolean, error: string}
 */
function validateUsername(username) {
    if (!username || typeof username !== 'string') {
        return { isValid: false, error: 'Username requis' };
    }

    if (username.length < 2) {
        return { isValid: false, error: 'Username doit contenir au moins 2 caractères' };
    }

    if (username.length > 30) {
        return { isValid: false, error: 'Username ne peut pas dépasser 30 caractères' };
    }

    // Vérifier les caractères autorisés (lettres, chiffres, underscore, tiret)
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    if (!validPattern.test(username)) {
        return { isValid: false, error: 'Username ne peut contenir que des lettres, chiffres, _ et -' };
    }

    return { isValid: true };
}

export { generateUniqueUsername, checkUsernameExists, validateUsername };
