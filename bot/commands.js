const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

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
  await bot.setMyCommands([
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
  try {
    await setupCommands(bot);
  } catch (error) {
    console.error("Failed to register commands with Telegram:", error.message);
    // Continue anyway as this is not critical
  }

  // Create inline keyboard markup helpers for node-telegram-bot-api
  const mainMenuKeyboard = {
    inline_keyboard: [
      [{ text: "View My Files", callback_data: "view_files" }],
      [{ text: "Clear All Files", callback_data: "clear_all" }],
      [{ text: "Help", callback_data: "help" }]
    ]
  };

  const helpKeyboard = {
    inline_keyboard: [
      [{ text: "Clear All Files", callback_data: "clear_all" }],
      [{ text: "View Statistics", callback_data: "stats" }]
    ]
  };

  const backToMenuKeyboard = {
    inline_keyboard: [
      [{ text: "Back to Menu", callback_data: "start" }]
    ]
  };

  const confirmClearKeyboard = {
    inline_keyboard: [
      [
        { text: "Yes, Delete Everything", callback_data: "confirm_clear" },
        { text: "No, Cancel", callback_data: "cancel_clear" }
      ]
    ]
  };

  // Start command
  bot.onText(/\/start/, async (msg) => {
    const userId = msg.from.id.toString();
    console.log(`👋 Start command from User ID: ${userId}`);
    
    await bot.sendMessage(
      msg.chat.id,
      "Welcome to Media Storage Bot! I can help you store and manage your files.",
      { reply_markup: mainMenuKeyboard }
    );
  });
  
  // Help command
  bot.onText(/\/help/, async (msg) => {
    await bot.sendMessage(
      msg.chat.id,
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
        reply_markup: helpKeyboard
      }
    );
  });
  
  // Clear all command
  bot.onText(/\/clearall/, async (msg) => {
    const userId = msg.from.id.toString();
    console.log(`🔹 /clearall command from User ID: ${userId}`);
    
    await bot.sendMessage(
      msg.chat.id,
      "⚠️ Are you sure you want to delete ALL your stored files?",
      { reply_markup: confirmClearKeyboard }
    );
  });
  
  // Stats command
  bot.onText(/\/stats/, async (msg) => {
    const userId = msg.from.id.toString();
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
      
      await bot.sendMessage(
        msg.chat.id,
        `📊 *Your Storage Statistics*\n\n` +
        `• Total files stored: ${fileCount}\n`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "Clear All Files", callback_data: "clear_all" }]
            ]
          }
        }
      );
    } catch (error) {
      console.error(`Stats error: ${error.message}`);
      await bot.sendMessage(msg.chat.id, "❌ Failed to retrieve your statistics.");
    }
  });
  
  // Handle callback queries from inline buttons
  bot.on("callback_query", async (callbackQuery) => {
    const userId = callbackQuery.from.id.toString();
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const data = callbackQuery.data;
    
    console.log(`👆 Callback query: ${data} from User ID: ${userId}`);
    
    // Acknowledge the callback query
    await bot.answerCallbackQuery(callbackQuery.id);
    
    if (data === "view_files") {
      console.log(`👁 View files action from User ID: ${userId}`);
      
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
          await bot.editMessageText(
            "You don't have any stored files yet. Send me a photo or document to get started!",
            {
              chat_id: chatId,
              message_id: messageId,
              reply_markup: backToMenuKeyboard
            }
          );
        } else {
          let message = "📁 *Your Recent Files*\n\n";
          
          filesResult.rows.forEach((file, index) => {
            const date = new Date(file.uploaded_at).toLocaleDateString();
            message += `${index + 1}. ${file.file_name} (${date})\n`;
          });
          
          await bot.editMessageText(
            message,
            {
              chat_id: chatId,
              message_id: messageId,
              parse_mode: "Markdown",
              reply_markup: {
                inline_keyboard: [
                  [{ text: "Clear All Files", callback_data: "clear_all" }],
                  [{ text: "Back to Menu", callback_data: "start" }]
                ]
              }
            }
          );
        }
      } catch (error) {
        console.error(`View files error: ${error.message}`);
        await bot.editMessageText(
          "❌ Failed to load your files.",
          {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: backToMenuKeyboard
          }
        );
      }
    } else if (data === "clear_all") {
      await bot.editMessageText(
        "⚠️ Are you sure you want to delete ALL your stored files?",
        {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: confirmClearKeyboard
        }
      );
    } else if (data === "cancel_clear") {
      await bot.editMessageText(
        "Operation canceled. Your files are safe.",
        {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: backToMenuKeyboard
        }
      );
    } else if (data === "confirm_clear") {
      console.log(`🔹 Confirming clearall for User ID: ${userId}`);
      
      await bot.editMessageText(
        "🔄 Processing your request...",
        {
          chat_id: chatId,
          message_id: messageId
        }
      );
      
      try {
        const client = new Client({
          user: "zen",
          host: "localhost",
          database: "zero",
          password: "yourpassword",
          port: 5432,
        });
        
        await client.connect();
        console.log("Connected to database for clearall");
        
        // Check file count
        const countRes = await client.query(
          "SELECT COUNT(*) FROM media_files WHERE user_id = $1", 
          [userId]
        );
        
        const fileCount = parseInt(countRes.rows[0].count);
        console.log(`Found ${fileCount} files for user ${userId}`);
        
        if (fileCount === 0) {
          await client.end();
          await bot.editMessageText(
            "⚠️ No files found in your storage.",
            {
              chat_id: chatId,
              message_id: messageId,
              reply_markup: backToMenuKeyboard
            }
          );
          return;
        }
        
        // Log a sample record for debugging
        const sampleRes = await client.query(
          "SELECT id, user_id, file_path FROM media_files WHERE user_id = $1 LIMIT 1",
          [userId]
        );
        
        if (sampleRes.rows.length > 0) {
          console.log(`Sample record before deletion: ${JSON.stringify(sampleRes.rows[0])}`);
        }
        
        // Delete database records with explicit transaction
        console.log(`Executing DELETE for user ${userId}...`);
        await client.query('BEGIN');
        const deleteRes = await client.query(
          "DELETE FROM media_files WHERE user_id = $1 RETURNING id",
          [userId]
        );
        await client.query('COMMIT');
        
        await client.end();
        
        console.log(`Deletion completed, affected ${deleteRes.rowCount} rows`);
        
        // Delete physical files
        const mediaDirectory = path.join(__dirname, `../media_storage/${userId}`);
        try {
          deleteAllFiles(mediaDirectory);
          console.log(`Deleted files directory at ${mediaDirectory}`);
        } catch (fsError) {
          console.error(`Error deleting files: ${fsError.message}`);
        }
        
        await bot.editMessageText(
          `✅ Successfully deleted ${deleteRes.rowCount} files from your storage.`,
          {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: backToMenuKeyboard
          }
        );
      } catch (error) {
        console.error(`Clearall error: ${error.message}`);
        console.error(error.stack);
        await bot.editMessageText(
          "❌ Failed to clear your storage. Technical error occurred.",
          {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: backToMenuKeyboard
          }
        );
      }
    } else if (data === "start") {
      await bot.editMessageText(
        "Welcome to Media Storage Bot! I can help you store and manage your files.",
        {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: mainMenuKeyboard
        }
      );
    } else if (data === "help") {
      await bot.editMessageText(
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
          chat_id: chatId,
          message_id: messageId,
          parse_mode: "Markdown",
          reply_markup: backToMenuKeyboard
        }
      );
    } else if (data === "stats") {
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
        
        await bot.editMessageText(
          `📊 *Your Storage Statistics*\n\n` +
          `• Total files stored: ${fileCount}\n`,
          {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [{ text: "Clear All Files", callback_data: "clear_all" }],
                [{ text: "Back to Menu", callback_data: "start" }]
              ]
            }
          }
        );
      } catch (error) {
        console.error(`Stats error: ${error.message}`);
        await bot.editMessageText(
          "❌ Failed to retrieve your statistics.",
          {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: backToMenuKeyboard
          }
        );
      }
    }
  });
}

module.exports = registerCommands;