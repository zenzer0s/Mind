const { Worker } = require("bullmq");
const Redis = require("ioredis");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const mediaQueue = require("./jobs/queue");

// Configure Redis connection with required options
const connection = new Redis({
  maxRetriesPerRequest: null,
  // Add other Redis options if needed
});

const mediaWorker = new Worker(
  "media-processing",
  async (job) => {
    const { filePath, fileName, userId } = job.data;
    console.log(`🚀 Processing: ${fileName}`);

    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath));
    formData.append("user_id", userId.toString()); // Ensure user_id is sent as a string

    try {
      const response = await axios.post("http://localhost:8081/process", formData, {
        headers: formData.getHeaders(),
      });

      console.log(`✅ File stored: ${response.data.filename}`);
    } catch (error) {
      console.error("❌ Error storing file:", error.response?.data || error.message);
    }
  },
  { connection }
);


async function handleMediaRequest(userId, fileUrl, fileName) {
  console.log(`📤 Adding job for ${fileName}, User ID: ${userId}`); // Debugging log

  await mediaQueue.add("process-media", { userId, fileUrl, fileName });
  console.log(`Added job for ${fileName} (${fileUrl})`);
}

module.exports = handleMediaRequest;
