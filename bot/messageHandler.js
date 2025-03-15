const { Worker } = require("bullmq");
const Redis = require("ioredis");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
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

    // Check if the file exists before sending
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Error: File not found - ${filePath}`);
      return;
    }

    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath));
    formData.append("user_id", userId.toString()); // Ensure user_id is sent as a string

    try {
      console.log(`📡 Sending file: ${filePath} to Go service...`);
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

// This function ONLY downloads the file and adds it to the queue
async function handleMediaRequest(userId, fileUrl, fileName) {
  console.log(`📡 Downloading file from Telegram (in memory): ${fileUrl}`);

  try {
    // Download the file from Telegram
    const response = await axios({
      url: fileUrl,
      method: "GET",
      responseType: "arraybuffer", // Load file into memory
      timeout: 30000, // 30 second timeout
    });

    const fileData = response.data;
    console.log(`✅ File downloaded in memory: ${fileName} (${fileData.length} bytes)`);

    // Add file data to queue with proper serialization
    await mediaQueue.add("process-media", {
      userId,
      fileName,
      fileData: Buffer.from(fileData).toString('base64') // Convert to base64 string for reliable queue transport
    });

    console.log(`📥 Added job for ${fileName}, User ID: ${userId} (processed in memory)`);
    
    return true;
  } catch (error) {
    console.error("❌ Error downloading file:", error.message);
    return false;
  }
}

module.exports = handleMediaRequest;
