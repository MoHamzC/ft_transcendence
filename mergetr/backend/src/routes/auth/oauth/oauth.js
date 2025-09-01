async function	jwtTokenOauth(request, reply, user) {
	try {
		const payload = { sub: user.id, id: user.id, username: user.username, email: user.email };
		const token = request.jwt.sign(payload);

		// En dev (HTTP), un cookie Secure n'est pas renvoyé => 401 sur /api/players/me
		// On le rend conditionnel: secure seulement en production ou si COOKIE_SECURE=true
		const secureFlag = process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production';
		reply.setCookie('access_token', token, {
			path: '/',
			httpOnly: true,
			secure: secureFlag,
			// SameSite none seulement si secure sinon Lax
			// (utile plus tard si tu passes sous HTTPS front/back séparés)
			// sameSite: secureFlag ? 'none' : 'lax'
		});
		const redirectUrl = request.query.next || 'http://localhost:5173/?login=success'
		return reply.redirect(redirectUrl);
	} catch (err) {
		console.log(err);
		return reply.code(400).send(err);
	};
};

async function	authRoutes(fastify, options) {

	// Test endpoint pour vérifier que les routes OAuth fonctionnent
	fastify.get('/test', async (request, reply) => {
		return { message: 'OAuth routes are working!', timestamp: new Date().toISOString() }
	})
}

export default authRoutes
export { jwtTokenOauth }
