const { Queue } = require("bullmq");
const Redis = require("ioredis");

// Configuration options for Redis
const redisOptions = {
  maxRetriesPerRequest: null,
  // Add other Redis options if needed
};

// Connects to Redis with error handling
const connection = new Redis(redisOptions);
connection.on('error', (err) => {
  console.error('Redis connection error:', err);
});

// Configuration options for the queue
const queueOptions = {
  connection,
  // Add other queue options here
};

const mediaQueue = new Queue("media-processing", queueOptions);

module.exports = mediaQueue;
