const mediaQueue = require("./jobs/queue");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

async function handleMediaRequest(userId, fileUrl, fileName) {
  // Download the file from Telegram
  const filePath = path.join(__dirname, "../downloads", fileName);
  const writer = fs.createWriteStream(filePath);

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

  // Add file to the queue
  await mediaQueue.add("process-media", { userId, filePath, fileName });
  console.log(`📥 Added job for ${fileName}`);
}

module.exports = handleMediaRequest;
