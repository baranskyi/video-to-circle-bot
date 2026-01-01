/**
 * Simple logger with timestamps
 */
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = level.toUpperCase().padEnd(5);
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

module.exports = { log };
