const { Telegraf } = require("telegraf");
const handleMediaRequest = require("./messageHandler");
const config = require("./config");

const bot = new Telegraf(config.botToken);

bot.on("message", async (ctx) => {
  const userId = ctx.from.id;

  // Handle documents (files like mp4, jpeg, etc.)
  if (ctx.message.document) {
    const fileId = ctx.message.document.file_id;
    const fileName = ctx.message.document.file_name;
    const fileUrl = await ctx.telegram.getFileLink(fileId); // Get actual file URL

    await handleMediaRequest(userId, fileUrl, fileName);
    return ctx.reply(`✅ Your file "${fileName}" has been added to the queue!`);
  }

  // Handle photos (Telegram sends multiple sizes, pick the highest resolution)
  if (ctx.message.photo) {
    const photoArray = ctx.message.photo;
    const highestResPhoto = photoArray[photoArray.length - 1]; // Get highest resolution
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
    }
  }

  // If message is unsupported, send error
  ctx.reply("❌ Unsupported file type. Please send an image, video, or document.");
});

bot.launch();
console.log("🤖 Bot is running...");
