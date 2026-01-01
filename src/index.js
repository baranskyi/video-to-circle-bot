require('dotenv').config();
const { createBot } = require('./bot');
const { ensureTempDir, cleanupOldFiles } = require('./utils/fileManager');
const { log } = require('./utils/logger');

async function main() {
  // Ensure temp directory exists
  ensureTempDir();

  // Start cleanup job (every 5 minutes)
  setInterval(cleanupOldFiles, 5 * 60 * 1000);

  // Create and launch bot
  const bot = createBot();

  // Graceful shutdown
  const shutdown = async (signal) => {
    log(`Received ${signal}, shutting down...`);
    bot.stop(signal);
    process.exit(0);
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));

  // Launch bot
  try {
    await bot.launch();
    log('Bot started successfully!');
    log(`Bot username: @${bot.botInfo.username}`);
  } catch (error) {
    log(`Failed to start bot: ${error.message}`, 'error');
    process.exit(1);
  }
}

main();
