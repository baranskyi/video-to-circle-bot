const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const { log } = require('../utils/logger');
const { LIMITS } = require('../utils/validators');

/**
 * Convert video to Telegram video note format
 * - Square aspect ratio (384x384)
 * - H.264 codec
 * - Max 60 seconds
 * - No audio
 * - Max 8 MB output
 */
async function convertToVideoNote(inputPath, outputPath, options = {}) {
  const {
    size = 384,
    maxDuration = 60,
    crf = 28,
    preset = 'fast'
  } = options;

  return new Promise((resolve, reject) => {
    // Build video filter for cropping and scaling
    // crop=min(iw,ih):min(iw,ih):(iw-min(iw,ih))/2:(ih-min(iw,ih))/2
    // This crops to square, centered
    const cropFilter = 'crop=min(iw\\,ih):min(iw\\,ih):(iw-min(iw\\,ih))/2:(ih-min(iw\\,ih))/2';
    const scaleFilter = `scale=${size}:${size}`;

    ffmpeg(inputPath)
      .videoFilters([cropFilter, scaleFilter])
      .outputOptions([
        '-c:v libx264',
        `-preset ${preset}`,
        `-crf ${crf}`,
        `-t ${maxDuration}`,
        '-an',                    // No audio
        '-movflags +faststart',   // Web optimization
        '-pix_fmt yuv420p'        // Compatibility
      ])
      .on('start', (command) => {
        log(`FFmpeg started: ${command}`);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          log(`Processing: ${Math.round(progress.percent)}%`);
        }
      })
      .on('error', (err) => {
        log(`FFmpeg error: ${err.message}`, 'error');
        reject(new Error(`FFmpeg error: ${err.message}`));
      })
      .on('end', async () => {
        log('FFmpeg conversion completed');

        // Check output file size
        try {
          const stats = fs.statSync(outputPath);

          if (stats.size > LIMITS.MAX_OUTPUT_SIZE) {
            log(`Output too large (${stats.size} bytes), retrying with lower quality...`);

            // Retry with lower quality
            fs.unlinkSync(outputPath);
            await convertToVideoNote(inputPath, outputPath, {
              size: 240,
              maxDuration,
              crf: 35,
              preset: 'medium'
            });
          }

          resolve(outputPath);
        } catch (err) {
          reject(err);
        }
      })
      .save(outputPath);
  });
}

/**
 * Get video metadata using ffprobe
 */
function getVideoInfo(inputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }

      const videoStream = metadata.streams.find(s => s.codec_type === 'video');

      resolve({
        duration: metadata.format.duration,
        size: metadata.format.size,
        width: videoStream?.width,
        height: videoStream?.height,
        codec: videoStream?.codec_name
      });
    });
  });
}

module.exports = { convertToVideoNote, getVideoInfo };
