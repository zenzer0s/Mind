// This file is intentionally left blank.const mediaQueue = require("./jobs/queue");

async function handleMediaRequest(userId, mediaUrl) {
    await mediaQueue.add("process-media", { userId, mediaUrl });
    console.log(`Added job for ${mediaUrl}`);
  }
  