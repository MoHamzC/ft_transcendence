async function	jwtTokenOauth(request, reply, user) {
	try {
		const payload = { sub: user.id, id: user.id, username: user.username, email: user.email };
		const token = request.jwt.sign(payload);

		reply.setCookie('access_token', token, { path:'/', httpOnly: true, secure:true });
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
