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
			minLength: 6,
			maxLength: 50,
		},
	},
};

export const createUserResponseSchema = {
	type: 'object',
	required: ["id", "email", "username"],
	properties: {
		id: { type: 'string' },
		email: { type: 'string', format: 'email' },
		username: { type: 'string' }
	}
};
