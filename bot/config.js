module.exports = {
    botToken: process.env.BOT_TOKEN || 'your-bot-token-here',
    apiEndpoint: process.env.API_ENDPOINT || 'http://localhost:3000',
    logLevel: process.env.LOG_LEVEL || 'info',
    commandPrefix: process.env.COMMAND_PREFIX || '!',
    databaseUrl: process.env.DATABASE_URL || 'mongodb://localhost:27017/mydatabase',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    serverPort: process.env.SERVER_PORT || 3000,
};