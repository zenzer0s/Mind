const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
const { Markup } = require("telegraf");

// Function to delete all media files
function deleteAllFiles(directory) {
  if (fs.existsSync(directory)) {
    fs.readdirSync(directory).forEach((file) => {
      const curPath = path.join(directory, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteAllFiles(curPath);
      } else {
        console.log(`🗑 Deleting file: ${curPath}`);
        fs.unlinkSync(curPath);
      }
    });
    console.log(`🗑 Deleting folder: ${directory}`);
    fs.rmdirSync(directory, { recursive: true });
  } else {
    console.log(`📂 No folder found at: ${directory}`);
  }
}

// Register commands with Telegram
async function setupCommands(bot) {
  // Register the commands with Telegram's BotFather
  await bot.telegram.setMyCommands([
    { command: "start", description: "Start the bot" },
    { command: "help", description: "Get help with using the bot" },
    { command: "clearall", description: "Clear all your stored files" },
    { command: "stats", description: "View your storage statistics" }
  ]);
  console.log("✅ Bot commands registered with Telegram");
}

// Register commands
async function registerCommands(bot) {
  // First register commands with Telegram
  await setupCommands(bot);

  // Start command
  bot.command("start", async (ctx) => {
    const userId = ctx.from.id.toString();
    console.log(`👋 Start command from User ID: ${userId}`);
    
    await ctx.reply(
      "Welcome to Media Storage Bot! I can help you store and manage your files.",
      Markup.inlineKeyboard([
        [Markup.button.callback("View My Files", "view_files")],
        [Markup.button.callback("Clear All Files", "clear_all")],
        [Markup.button.callback("Help", "help")]
      ])
    );
  });
  
  // Help command
  bot.command("help", async (ctx) => {
    await ctx.reply(
      "📖 *Media Storage Bot Help*\n\n" +
      "I can store your media files and help you manage them.\n\n" +
      "*Commands:*\n" +
      "• /start - Start the bot and view main menu\n" +
      "• /help - Show this help message\n" +
      "• /clearall - Delete all your stored files\n" +
      "• /stats - View your storage statistics\n\n" +
      "*How to use:*\n" +
      "Simply send me any photo, document, or file and I'll store it for you!",
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.callback("Clear All Files", "clear_all")],
          [Markup.button.callback("View Statistics", "stats")]
        ])
      }
    );
  });
  
  // Clear all command
  bot.command("clearall", async (ctx) => {
    const userId = ctx.from.id.toString();
    console.log(`🔹 /clearall command from User ID: ${userId}`);
    
    await ctx.reply(
      "⚠️ Are you sure you want to delete ALL your stored files?",
      Markup.inlineKeyboard([
        [
          Markup.button.callback("Yes, Delete Everything", "confirm_clear"),
          Markup.button.callback("No, Cancel", "cancel_clear")
        ]
      ])
    );
  });
  
  // Stats command
  bot.command("stats", async (ctx) => {
    const userId = ctx.from.id.toString();
    console.log(`📊 Stats command from User ID: ${userId}`);
    
    try {
      const client = new Client({
        user: "zen",
        host: "localhost",
        database: "zero",
        password: "yourpassword",
        port: 5432,
      });
      
      await client.connect();
      
      const countResult = await client.query(
        "SELECT COUNT(*) FROM media_files WHERE user_id = $1",
        [userId]
      );
      
      const fileCount = parseInt(countResult.rows[0].count);
      
      await client.end();
      
      await ctx.reply(
        `📊 *Your Storage Statistics*\n\n` +
        `• Total files stored: ${fileCount}\n`,
        {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([
            [Markup.button.callback("Clear All Files", "clear_all")]
          ])
        }
      );
    } catch (error) {
      console.error(`Stats error: ${error.message}`);
      await ctx.reply("❌ Failed to retrieve your statistics.");
    }
  });
  
  // Handle inline button callbacks
  bot.action("view_files", async (ctx) => {
    const userId = ctx.from.id.toString();
    console.log(`👁 View files action from User ID: ${userId}`);
    
    await ctx.answerCbQuery("Loading your files...");
    
    try {
      const client = new Client({
        user: "zen",
        host: "localhost",
        database: "zero",
        password: "yourpassword",
        port: 5432,
      });
      
      await client.connect();
      
      const filesResult = await client.query(
        "SELECT file_name, file_type, uploaded_at FROM media_files WHERE user_id = $1 ORDER BY uploaded_at DESC LIMIT 5",
        [userId]
      );
      
      await client.end();
      
      if (filesResult.rows.length === 0) {
        await ctx.editMessageText(
          "You don't have any stored files yet. Send me a photo or document to get started!",
          Markup.inlineKeyboard([
            [Markup.button.callback("Back to Menu", "start")]
          ])
        );
      } else {
        let message = "📁 *Your Recent Files*\n\n";
        
        filesResult.rows.forEach((file, index) => {
          const date = new Date(file.uploaded_at).toLocaleDateString();
          message += `${index + 1}. ${file.file_name} (${date})\n`;
        });
        
        await ctx.editMessageText(
          message,
          {
            parse_mode: "Markdown",
            ...Markup.inlineKeyboard([
              [Markup.button.callback("Clear All Files", "clear_all")],
              [Markup.button.callback("Back to Menu", "start")]
            ])
          }
        );
      }
    } catch (error) {
      console.error(`View files error: ${error.message}`);
      await ctx.editMessageText(
        "❌ Failed to load your files.",
        Markup.inlineKeyboard([
          [Markup.button.callback("Back to Menu", "start")]
        ])
      );
    }
  });
  
  bot.action("clear_all", async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      "⚠️ Are you sure you want to delete ALL your stored files?",
      Markup.inlineKeyboard([
        [
          Markup.button.callback("Yes, Delete Everything", "confirm_clear"),
          Markup.button.callback("No, Cancel", "cancel_clear")
        ]
      ])
    );
  });
  
  bot.action("cancel_clear", async (ctx) => {
    await ctx.answerCbQuery("Operation canceled");
    await ctx.editMessageText(
      "Operation canceled. Your files are safe.",
      Markup.inlineKeyboard([
        [Markup.button.callback("Back to Menu", "start")]
      ])
    );
  });
  
  bot.action("confirm_clear", async (ctx) => {
    const userId = ctx.from.id.toString();
    console.log(`🔹 Confirming clearall for User ID: ${userId}`);
    
    await ctx.answerCbQuery("Processing...");
    await ctx.editMessageText("🔄 Processing your request...");
    
    try {
      const client = new Client({
        user: "zen",
        host: "localhost",
        database: "zero",
        password: "yourpassword",
        port: 5432,
      });
      
      await client.connect();
      
      // Check file count
      const countRes = await client.query(
        "SELECT COUNT(*) FROM media_files WHERE user_id = $1", 
        [userId]
      );
      
      const fileCount = parseInt(countRes.rows[0].count);
      
      if (fileCount === 0) {
        await client.end();
        await ctx.editMessageText(
          "⚠️ No files found in your storage.",
          Markup.inlineKeyboard([
            [Markup.button.callback("Back to Menu", "start")]
          ])
        );
        return;
      }
      
      // Delete database records
      console.log(`Executing DELETE for user ${userId}...`);
      const deleteRes = await client.query(
        "DELETE FROM media_files WHERE user_id = $1 RETURNING id",
        [userId]
      );
      
      await client.end();
      
      console.log(`Deletion completed, affected ${deleteRes.rowCount} rows`);
      
      // Delete physical files
      const mediaDirectory = path.join(__dirname, `../media_storage/${userId}`);
      try {
        deleteAllFiles(mediaDirectory);
      } catch (fsError) {
        console.error(`Error deleting files: ${fsError.message}`);
      }
      
      await ctx.editMessageText(
        `✅ Successfully deleted ${deleteRes.rowCount} files from your storage.`,
        Markup.inlineKeyboard([
          [Markup.button.callback("Back to Menu", "start")]
        ])
      );
    } catch (error) {
      console.error(`Clearall error: ${error.message}`);
      await ctx.editMessageText(
        "❌ Failed to clear your storage. Technical error occurred.",
        Markup.inlineKeyboard([
          [Markup.button.callback("Back to Menu", "start")]
        ])
      );
    }
  });
  
  bot.action("start", async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      "Welcome to Media Storage Bot! I can help you store and manage your files.",
      Markup.inlineKeyboard([
        [Markup.button.callback("View My Files", "view_files")],
        [Markup.button.callback("Clear All Files", "clear_all")],
        [Markup.button.callback("Help", "help")]
      ])
    );
  });
  
  bot.action("help", async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      "📖 *Media Storage Bot Help*\n\n" +
      "I can store your media files and help you manage them.\n\n" +
      "*Commands:*\n" +
      "• /start - Start the bot and view main menu\n" +
      "• /help - Show this help message\n" +
      "• /clearall - Delete all your stored files\n" +
      "• /stats - View your storage statistics\n\n" +
      "*How to use:*\n" +
      "Simply send me any photo, document, or file and I'll store it for you!",
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.callback("Back to Menu", "start")]
        ])
      }
    );
  });
}

module.exports = registerCommands;