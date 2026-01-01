const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { convertToVideoNote } = require('../services/converter');
const { downloadFile, cleanupFiles, TEMP_DIR } = require('../utils/fileManager');
const { validateVideo, LIMITS } = require('../utils/validators');
const { log } = require('../utils/logger');

const ERROR_MESSAGES = {
  FILE_TOO_LARGE: `File too large. Maximum size is ${LIMITS.MAX_FILE_SIZE / 1024 / 1024} MB.`,
  CONVERSION_FAILED: 'Failed to convert video. Please try a different video.',
  OUTPUT_TOO_LARGE: 'Output file is too large. Please try a shorter video.',
  DOWNLOAD_FAILED: 'Failed to download video. Please try again.',
  UNEXPECTED: 'Something went wrong. Please try again later.',
  NO_VIDEO: 'Please send a video file.',
};

async function handleVideo(ctx) {
  const sessionId = uuidv4();
  let processingMsg = null;
  const filesToCleanup = [];

  try {
    // Get video info
    const video = ctx.message.video || ctx.message.document;

    if (!video) {
      return ctx.reply(ERROR_MESSAGES.NO_VIDEO);
    }

    // Validate file size
    const validation = validateVideo(video.file_size);
    if (!validation.valid) {
      return ctx.reply(validation.errors.join('\n'));
    }

    // Send processing message
    processingMsg = await ctx.reply('Processing your video...');

    // Get file info from Telegram
    const fileInfo = await ctx.telegram.getFile(video.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${fileInfo.file_path}`;

    // Determine file extension
    const ext = path.extname(fileInfo.file_path) || '.mp4';
    const inputPath = path.join(TEMP_DIR, `${sessionId}_input${ext}`);
    const outputPath = path.join(TEMP_DIR, `${sessionId}_output.mp4`);

    filesToCleanup.push(inputPath, outputPath);

    // Download video
    log(`Downloading video for session ${sessionId}`);
    await downloadFile(fileUrl, inputPath);

    // Check if file was downloaded
    if (!fs.existsSync(inputPath)) {
      throw new Error('DOWNLOAD_FAILED');
    }

    // Update status
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      processingMsg.message_id,
      null,
      'Converting to video note...'
    ).catch(() => {});

    // Convert video
    log(`Converting video for session ${sessionId}`);
    await convertToVideoNote(inputPath, outputPath);

    // Check output file
    if (!fs.existsSync(outputPath)) {
      throw new Error('CONVERSION_FAILED');
    }

    const outputStats = fs.statSync(outputPath);
    if (outputStats.size > LIMITS.MAX_OUTPUT_SIZE) {
      throw new Error('OUTPUT_TOO_LARGE');
    }

    // Send video note
    log(`Sending video note for session ${sessionId}`);
    await ctx.replyWithVideoNote({ source: outputPath });

    // Delete processing message
    await ctx.telegram.deleteMessage(ctx.chat.id, processingMsg.message_id).catch(() => {});

    log(`Successfully processed video for session ${sessionId}`);

  } catch (error) {
    log(`Error processing video: ${error.message}`, 'error');

    // Determine user-friendly error message
    let userMessage = ERROR_MESSAGES.UNEXPECTED;
    if (error.message in ERROR_MESSAGES) {
      userMessage = ERROR_MESSAGES[error.message];
    } else if (error.message.includes('FFmpeg')) {
      userMessage = ERROR_MESSAGES.CONVERSION_FAILED;
    }

    // Update or send error message
    if (processingMsg) {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        processingMsg.message_id,
        null,
        userMessage
      ).catch(() => ctx.reply(userMessage));
    } else {
      await ctx.reply(userMessage);
    }

  } finally {
    // Cleanup temp files
    cleanupFiles(filesToCleanup);
  }
}

function setupVideoHandler(bot) {
  // Handle video messages
  bot.on('video', handleVideo);

  // Handle documents (in case video is sent as file)
  bot.on('document', (ctx) => {
    const doc = ctx.message.document;
    if (doc.mime_type && doc.mime_type.startsWith('video/')) {
      return handleVideo(ctx);
    }
    // Ignore non-video documents
  });
}

module.exports = { setupVideoHandler };
