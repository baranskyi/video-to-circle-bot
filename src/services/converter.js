const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const { log } = require('../utils/logger');
const { LIMITS } = require('../utils/validators');

// Compression levels - progressively more aggressive
const COMPRESSION_LEVELS = [
  { size: 384, crf: 28, preset: 'fast' },
  { size: 320, crf: 32, preset: 'medium' },
  { size: 256, crf: 35, preset: 'medium' },
  { size: 240, crf: 38, preset: 'slow' },
];

/**
 * Convert video to Telegram video note format
 * - Square aspect ratio
 * - H.264 codec + AAC audio
 * - Max 60 seconds
 * - Auto-compress to fit under 8 MB
 */
async function convertToVideoNote(inputPath, outputPath, levelIndex = 0) {
  const maxDuration = 60;
  const level = COMPRESSION_LEVELS[levelIndex];

  if (!level) {
    throw new Error('OUTPUT_TOO_LARGE');
  }

  log(`Trying compression level ${levelIndex + 1}/${COMPRESSION_LEVELS.length}: ${level.size}px, CRF ${level.crf}`);

  return new Promise((resolve, reject) => {
    const cropFilter = 'crop=min(iw\\,ih):min(iw\\,ih):(iw-min(iw\\,ih))/2:(ih-min(iw\\,ih))/2';
    const scaleFilter = `scale=${level.size}:${level.size}`;

    ffmpeg(inputPath)
      .videoFilters([cropFilter, scaleFilter])
      .outputOptions([
        '-c:v libx264',
        `-preset ${level.preset}`,
        `-crf ${level.crf}`,
        `-t ${maxDuration}`,
        '-c:a aac',
        '-b:a 128k',
        '-movflags +faststart',
        '-pix_fmt yuv420p'
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

        try {
          const stats = fs.statSync(outputPath);
          const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
          log(`Output size: ${sizeMB} MB`);

          if (stats.size > LIMITS.MAX_OUTPUT_SIZE) {
            log(`Output too large, trying next compression level...`);
            fs.unlinkSync(outputPath);

            // Try next compression level
            const result = await convertToVideoNote(inputPath, outputPath, levelIndex + 1);
            resolve(result);
          } else {
            resolve(outputPath);
          }
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
