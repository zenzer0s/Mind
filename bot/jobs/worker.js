const { Worker } = require("bullmq");
const Redis = require("ioredis");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { v4: uuidv4 } = require("uuid");

console.log("🚀 Media worker starting up...");

// Configure Redis with required options
const connection = new Redis({
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});

console.log("📡 Connected to Redis");

const mediaWorker = new Worker(
  "media-processing",
  async (job) => {
    console.log(`📦 Received job: ${job.id}`);
    console.log(`📋 Job data keys: ${Object.keys(job.data).join(', ')}`);
    
    // Extract the data from job
    const { fileName, userId, fileData } = job.data;
    
    console.log(`🔍 Processing file: ${fileName}`);
    console.log(`🔍 User ID: ${userId}`);
    console.log(`🔍 File data type: ${typeof fileData}`);
    console.log(`🔍 File data length: ${fileData ? fileData.length : 'N/A'} bytes`);
    
    if (!fileName || !userId) {
      console.error('❌ Error: Missing required job data');
      return { success: false, error: 'Missing required job data' };
    }
    
    try {
      // Make sure we have file data
      if (!fileData || !fileData.length) {
        console.error('❌ Error: No file data provided');
        return { success: false, error: 'No file data provided' };
      }
      
      // Create a temp file with a unique name
      const tempDir = os.tmpdir();
      const tempFile = path.join(tempDir, `${uuidv4()}-${fileName}`);
      
      console.log(`💾 Writing to temp file: ${tempFile}`);
      
      // Write the buffer to the temp file
      fs.writeFileSync(
        tempFile, 
        Buffer.isBuffer(fileData) ? fileData : Buffer.from(fileData)
      );
      
      // Verify the file exists
      if (!fs.existsSync(tempFile)) {
        throw new Error(`Failed to create temp file: ${tempFile}`);
      }
      
      console.log(`✅ Temp file created: ${tempFile}`);
      
      // Create form data for the API request
      console.log(`📤 Sending to Go service: ${tempFile}`);
      const formData = new FormData();
      formData.append('file', fs.createReadStream(tempFile));
      formData.append('user_id', userId.toString());
      
      // Send to the Go service
      const response = await axios.post(
        'http://localhost:8081/process',
        formData,
        {
          headers: formData.getHeaders(),
          timeout: 60000
        }
      );
      
      console.log(`✅ Success! Response:`, response.data);
      
      // Clean up the temp file
      fs.unlinkSync(tempFile);
      console.log(`🧹 Temp file deleted: ${tempFile}`);
      
      return { success: true };
      
    } catch (error) {
      console.error(`❌ Error processing ${fileName}:`, error.message);
      if (error.response) {
        console.error(`Response status: ${error.response.status}`);
        console.error(`Response data:`, error.response.data);
      }
      return { success: false, error: error.message };
    }
  },
  {
    connection,
    concurrency: 2,
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 100 }
  }
);

// Handle worker events for better debugging
mediaWorker.on('completed', job => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

mediaWorker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);
});

console.log("🎯 Media worker ready and waiting for jobs");

process.on('SIGINT', async () => {
  console.log('Shutting down worker gracefully...');
  await mediaWorker.close();
  process.exit(0);
});

module.exports = mediaWorker;
