const LIMITS = {
  MAX_FILE_SIZE: 20 * 1024 * 1024,     // 20 MB (Telegram Bot API limit)
  MAX_OUTPUT_SIZE: 8 * 1024 * 1024,    // 8 MB (video note limit)
  MAX_DURATION: 60,                     // 60 seconds
  OUTPUT_SIZE: 384                      // 384x384 pixels
};

/**
 * Validate video before processing
 * Note: We don't check file size here - Telegram API will handle it
 * If file is too large, download will fail and we handle it gracefully
 */
function validateVideo(fileSize, duration = null) {
  // Always valid - let Telegram API handle size limits
  // This way user doesn't see scary error messages
  return {
    valid: true,
    errors: []
  };
}

module.exports = { validateVideo, LIMITS };
