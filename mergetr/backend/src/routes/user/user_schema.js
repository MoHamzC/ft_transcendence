export const createUserSchema = {
	type: 'object',
	required: ["email", "username", "password"],
	additionalProperties: false, // Sécurité: rejeter les propriétés non définies
	properties: {
		email: {
			type: 'string',
			format: 'email',
			maxLength: 254, // RFC 5321
			pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
		},
		username: {
			type: 'string',
			minLength: 3,
			maxLength: 30,
			pattern: '^[a-zA-Z0-9_-]+$' // Seulement alphanumériques, underscore et tiret
		},
		password: {
			type: 'string',
			minLength: 12,
			maxLength: 128, // Éviter les DoS
			// Pattern pour vérifier la complexité
			pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};\':"\\\\|,.<>\\/?]).{12,}$'
		},
	},
};

export const createUserResponseSchema = {
	type: 'object',
	required: ["email", "username"],
	additionalProperties: false,
	properties: {
		email: { type: 'string', format: 'email' },
		username: { type: 'string' },
		id: { type: 'integer' } // Retourner l'ID mais pas le mot de passe
	}
};

// Schéma pour la connexion
export const loginSchema = {
	type: 'object',
	required: ["email", "password"],
	additionalProperties: false,
	properties: {
		email: {
			type: 'string',
			format: 'email',
			maxLength: 254
		},
		password: {
			type: 'string',
			minLength: 1,
			maxLength: 128
		}
	}
};

// Schéma pour OTP
export const otpSchema = {
	type: 'object',
	required: ["email", "otp_code"],
	additionalProperties: false,
	properties: {
		email: {
			type: 'string',
			format: 'email',
			maxLength: 254
		},
		otp_code: {
			type: 'string',
			pattern: '^[0-9]{6}$' // Exactement 6 chiffres
		}
	}
};
