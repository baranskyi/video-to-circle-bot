const LIMITS = {
  MAX_FILE_SIZE: 20 * 1024 * 1024,     // 20 MB (Telegram Bot API limit)
  MAX_OUTPUT_SIZE: 8 * 1024 * 1024,    // 8 MB (video note limit)
  MAX_DURATION: 60,                     // 60 seconds
  OUTPUT_SIZE: 384                      // 384x384 pixels
};

/**
 * Validate video before processing
 */
function validateVideo(fileSize, duration = null) {
  const errors = [];

  if (fileSize > LIMITS.MAX_FILE_SIZE) {
    errors.push(`File too large. Maximum size is ${LIMITS.MAX_FILE_SIZE / 1024 / 1024} MB.`);
  }

  // Duration validation is informational only
  // (we'll trim the video anyway)

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = { validateVideo, LIMITS };
