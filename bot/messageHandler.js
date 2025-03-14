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

async function handleMediaRequest(userId, fileUrl, fileName) {
  const downloadsPath = path.join(__dirname, "../downloads");

  // Ensure the 'downloads' directory exists
  if (!fs.existsSync(downloadsPath)) {
    fs.mkdirSync(downloadsPath, { recursive: true });
  }

  // Define the correct file path
  const filePath = path.join(downloadsPath, fileName);
  const writer = fs.createWriteStream(filePath);

  // Download the file from Telegram
  const response = await axios({
    url: fileUrl,
    method: "GET",
    responseType: "stream",
  });

  response.data.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });

  console.log(`✅ Downloaded file: ${filePath}`);

  // Add the correct filePath to BullMQ
  await mediaQueue.add("process-media", { userId, filePath, fileName });
  console.log(`📥 Added job for ${fileName}, User ID: ${userId}, File Path: ${filePath}`);
}

module.exports = handleMediaRequest;
