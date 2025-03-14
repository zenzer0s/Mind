const { Telegraf } = require("telegraf");
const handleMediaRequest = require("./messageHandler");
const config = require("./config");
const registerCommands = require("./commands");

const bot = new Telegraf(config.botToken);

// Log every user message
bot.on("message", async (ctx) => {
  console.log(`📩 Received message from User ID: ${ctx.from.id}`);
  
  const userId = ctx.from.id;
  
  // Check for commands first
  if (ctx.message.text && ctx.message.text.startsWith('/')) {
    // This is a command, let the command handler deal with it
    return;
  }

  // Handle documents (files like mp4, jpeg, etc.)
  if (ctx.message.document) {
    const fileId = ctx.message.document.file_id;
    const fileName = ctx.message.document.file_name;
    const fileUrl = await ctx.telegram.getFileLink(fileId);

    await handleMediaRequest(userId, fileUrl, fileName);
    return ctx.reply(`✅ Your file "${fileName}" has been added to the queue!`);
  }

  // Handle photos (Telegram sends multiple sizes, pick the highest resolution)
  if (ctx.message.photo) {
    const photoArray = ctx.message.photo;
    const highestResPhoto = photoArray[photoArray.length - 1];
    const fileId = highestResPhoto.file_id;
    const fileUrl = await ctx.telegram.getFileLink(fileId);

    await handleMediaRequest(userId, fileUrl, "photo.jpg");
    return ctx.reply(`✅ Your image has been added to the queue!`);
  }

  // Handle text messages (only if they contain a URL)
  if (ctx.message.text) {
    const messageText = ctx.message.text;

    if (messageText.startsWith("http")) {
      await handleMediaRequest(userId, messageText, "text-url");
      return ctx.reply("✅ Your media request has been added to the queue!");
    } else {
      // Only reply for non-command text messages
      return ctx.reply(
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
  }

  // If message is unsupported, send error
  ctx.reply("❌ Unsupported file type. Please send an image, video, or document.");
});

// Handle keyboard button presses
bot.hears("📊 View Statistics", (ctx) => ctx.command.stats());
bot.hears("🗑 Clear All Files", (ctx) => ctx.command.clearall());
bot.hears("❓ Help", (ctx) => ctx.command.help());

// Initialize bot
async function startBot() {
  try {
    // Register all commands
    await registerCommands(bot);
    
    // Start the bot
    await bot.launch();
    console.log("🤖 Bot is running...");
  } catch (error) {
    console.error("Failed to start the bot:", error);
  }
}

startBot();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
