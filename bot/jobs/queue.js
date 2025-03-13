const { Queue } = require("bullmq");
const Redis = require("ioredis");

// Create a connection to Redis
const connection = new Redis(); 

// Create a BullMQ queue named "media-processing"
const mediaQueue = new Queue("media-processing", { connection });

module.exports = mediaQueue;
