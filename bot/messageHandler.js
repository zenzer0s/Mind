const mediaQueue = require("./jobs/queue");

async function handleMediaRequest(userId, fileUrl, fileName) {
  await mediaQueue.add("process-media", { userId, fileUrl, fileName });
  console.log(`Added job for ${fileName} (${fileUrl})`);
}

module.exports = handleMediaRequest;
