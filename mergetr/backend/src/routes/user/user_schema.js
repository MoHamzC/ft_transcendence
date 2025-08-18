export const createUserSchema = {
	type: 'object',
	required: ["email", "username", "password"],
	properties: {
		email: {
			type: 'string',
			format: 'email'
		},
		username: {
			type: 'string',
			minLength: 1,
			maxLength: 30
		},
		password: {
			type: 'string',
			minLength: 12,
			maxLength: 30,
		},
	},
};

export const createUserResponseSchema = {
	type: 'object',
	required: ["email", "username", "password"],
	properties: {
		email: { type: 'string', format: 'email' },
		username: { type: 'string' },
		password: { type: 'string' }
	}
};
