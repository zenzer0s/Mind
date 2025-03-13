const { Worker } = require("bullmq");
const Redis = require("ioredis");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

// Configure Redis connection with required options
const connection = new Redis({
  maxRetriesPerRequest: null,
  // Add other Redis options if needed
});

// Create a worker that listens to the "media-processing" queue
const mediaWorker = new Worker(
  "media-processing",
  async (job) => {
    const { filePath, fileName, userId } = job.data;
    console.log(`🚀 Processing: ${fileName}, User ID: ${userId}`); // Debugging log

    // Send file to Go microservice
    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath));
    formData.append("user_id", userId.toString());

    try {
      console.log("📡 Sending file to Go service...");
      const response = await axios.post("http://localhost:8081/process", formData, {
        headers: formData.getHeaders(),
      });

      console.log(`✅ File stored: ${response.data.filename}`);
    } catch (error) {
      console.error("❌ Error sending file:", error.response?.data || error.message);
    }
  },
  { connection }
);

module.exports = mediaWorker;
