const { Worker } = require("bullmq");
const Redis = require("ioredis");

const connection = new Redis({
  maxRetriesPerRequest: null, // Fix for BullMQ error
});

const mediaWorker = new Worker(
  "media-processing",
  async (job) => {
    console.log(`Processing job ID: ${job.id}, Data:`, job.data);

    // Simulate media processing (replace with actual Go API call later)
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log(`Job ID: ${job.id} completed!`);
  },
  { connection }
);

module.exports = mediaWorker;
