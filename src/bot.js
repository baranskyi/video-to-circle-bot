const { Telegraf } = require('telegraf');
const { setupCommands } = require('./handlers/commands');
const { setupVideoHandler } = require('./handlers/video');
const { rateLimitMiddleware } = require('./utils/rateLimit');
const { log } = require('./utils/logger');

function createBot() {
  const token = process.env.BOT_TOKEN;

  if (!token) {
    throw new Error('BOT_TOKEN environment variable is required');
  }

  const bot = new Telegraf(token);

  // Error handling middleware
  bot.catch((err, ctx) => {
    log(`Error for ${ctx.updateType}: ${err.message}`, 'error');
  });

  // Rate limiting middleware
  bot.use(rateLimitMiddleware);

  // Setup handlers
  setupCommands(bot);
  setupVideoHandler(bot);

  return bot;
}

module.exports = { createBot };
