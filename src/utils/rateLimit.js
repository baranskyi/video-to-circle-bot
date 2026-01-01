const userRequests = new Map();

const RATE_LIMIT = {
  MAX_REQUESTS: 5,           // Max requests
  WINDOW_MS: 60 * 1000       // Per 1 minute
};

/**
 * Rate limiting middleware for Telegraf
 */
function rateLimitMiddleware(ctx, next) {
  // Only rate limit video/document messages
  if (!ctx.message?.video && !ctx.message?.document) {
    return next();
  }

  const userId = ctx.from?.id;
  if (!userId) return next();

  const now = Date.now();

  // Get or create user request history
  if (!userRequests.has(userId)) {
    userRequests.set(userId, []);
  }

  const requests = userRequests.get(userId);

  // Filter to only recent requests within window
  const recentRequests = requests.filter(
    time => now - time < RATE_LIMIT.WINDOW_MS
  );

  // Check if over limit
  if (recentRequests.length >= RATE_LIMIT.MAX_REQUESTS) {
    const waitTime = Math.ceil(
      (RATE_LIMIT.WINDOW_MS - (now - recentRequests[0])) / 1000
    );
    return ctx.reply(
      `Too many requests. Please wait ${waitTime} seconds.`
    );
  }

  // Add current request and update map
  recentRequests.push(now);
  userRequests.set(userId, recentRequests);

  return next();
}

// Cleanup old entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [userId, requests] of userRequests.entries()) {
    const recent = requests.filter(
      time => now - time < RATE_LIMIT.WINDOW_MS
    );
    if (recent.length === 0) {
      userRequests.delete(userId);
    } else {
      userRequests.set(userId, recent);
    }
  }
}, 5 * 60 * 1000);

module.exports = { rateLimitMiddleware };
