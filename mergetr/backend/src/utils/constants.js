// src/utils/constants.js
// Constantes de l'application

export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500
}

export const JWT_EXPIRY = {
    ACCESS_TOKEN: '15m',
    REFRESH_TOKEN: '7d'
}

export const OTP_CONFIG = {
    LENGTH: 6,
    EXPIRY_MINUTES: 10
}

export const OAUTH_PROVIDERS = {
    GITHUB: 'github',
    GOOGLE: 'google',
    INTRA_42: '42'
}
