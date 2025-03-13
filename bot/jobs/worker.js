const { Worker } = require("bullmq");
const Redis = require("ioredis");

const connection = new Redis(); // Connects to Redis

const mediaWorker = new Worker(
  "media-processing",
  async (job) => {
    console.log(`Processing job ID: ${job.id}, Data:`, job.data);
    // Add Go API call logic here to process media
  },
  { connection }
);

module.exports = mediaWorker;
