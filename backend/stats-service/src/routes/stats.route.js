const fastify = require('fastify')({ logger: true });
const dotenv = require('dotenv');
dotenv.config();

fastify.register(require('./stats.route'), { prefix: '/stats' });

fastify.listen({ port: 3003 }, (err) =>
{
    if (err)
    {
        fastify.log.error(err);
        process.exit(1);
    }
    fastify.log.info('🚀 Stats Service listening on port 3003');
});
