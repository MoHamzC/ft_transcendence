const fastify = require('fastify')({ logger: true });
const dotenv = require('dotenv');
dotenv.config();

fastify.register(require('./routes/user.route'), { prefix: '/users' });

fastify.listen({ port: 3002 }, (err) =>
{
    if (err)
    {
        fastify.log.error(err);
        process.exit(1);
    }
    fastify.log.info('🚀 User Service listening on port 3002');
});
