const TelegramBot = require("node-telegram-bot-api");
const handleMediaRequest = require("./messageHandler");
const config = require("./config");
const registerCommands = require("./commands");

// Initialize the bot with polling
const bot = new TelegramBot(config.botToken, { polling: true });

console.log("🤖 Bot is running...");

// Handle media uploads (Images, Videos, Documents)
bot.on("message", async (msg) => {
  // Skip command messages - they're handled by the command handler
  if (msg.text && (msg.text.startsWith('/start') || 
                   msg.text.startsWith('/help') || 
                   msg.text.startsWith('/clearall') || 
                   msg.text.startsWith('/stats'))) {
    return;
  }

  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (msg.photo || msg.video || msg.document) {
    let fileId, fileName;

    if (msg.photo) {
      // Get the highest resolution photo
      const photo = msg.photo[msg.photo.length - 1];
      fileId = photo.file_id;
      fileName = `photo_${Date.now()}.jpg`;
      console.log(`📷 Received photo from User ID: ${userId}`);
    } else if (msg.video) {
      fileId = msg.video.file_id;
      fileName = msg.video.file_name || `video_${Date.now()}.mp4`;
      console.log(`🎬 Received video from User ID: ${userId}`);
    } else if (msg.document) {
      fileId = msg.document.file_id;
      fileName = msg.document.file_name || `document_${Date.now()}`;
      console.log(`📄 Received document from User ID: ${userId}`);
    }

    try {
      const fileUrl = await bot.getFileLink(fileId);
      console.log(`📥 Processing media: ${fileName} from User ID: ${userId}`);

      await handleMediaRequest(userId, fileUrl, fileName);
      
      await bot.sendMessage(
        chatId, 
        `✅ Your file "${fileName}" has been added to the queue!`, 
        { 
          reply_markup: {
            inline_keyboard: [
              [{ text: "View My Files", callback_data: "view_files" }],
              [{ text: "Clear All Files", callback_data: "clear_all" }]
            ]
          }
        }
      );
    } catch (error) {
      console.error("❌ Error processing media:", error);
      await bot.sendMessage(chatId, "❌ Failed to process your file.");
    }
  } else if (msg.text) {
    // For text messages that are not commands
    await bot.sendMessage(
      chatId, 
      "I can store your media files. Please send me a photo, document, or file.",
      {
        reply_markup: {
          keyboard: [
            ["📊 View Statistics"],
            ["🗑 Clear All Files", "❓ Help"]
          ],
          resize_keyboard: true
        }
      }
    );
  }
});

// Handle keyboard button presses
bot.onText(/📊 View Statistics/, (msg) => {
  bot.processUpdate({
    message: {
      ...msg,
      text: '/stats'
    }
  });
});

bot.onText(/🗑 Clear All Files/, (msg) => {
  bot.processUpdate({
    message: {
      ...msg,
      text: '/clearall'
    }
  });
});

bot.onText(/❓ Help/, (msg) => {
  bot.processUpdate({
    message: {
      ...msg,
      text: '/help'
    }
  });
});

// Register commands and callback handlers
registerCommands(bot);

// Enable graceful stop
process.once('SIGINT', () => bot.stopPolling());
process.once('SIGTERM', () => bot.stopPolling());
