const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { log } = require('./logger');

const TEMP_DIR = path.join(process.cwd(), 'temp');
const MAX_FILE_AGE_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Ensure temp directory exists
 */
function ensureTempDir() {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
    log(`Created temp directory: ${TEMP_DIR}`);
  }
}

/**
 * Download file from URL to local path
 */
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);

    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve(destPath);
      });

      file.on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

/**
 * Clean up specific files
 */
function cleanupFiles(filePaths) {
  for (const filePath of filePaths) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        log(`Cleaned up: ${path.basename(filePath)}`);
      }
    } catch (err) {
      log(`Failed to cleanup ${filePath}: ${err.message}`, 'warn');
    }
  }
}

/**
 * Clean up old files in temp directory
 */
function cleanupOldFiles() {
  try {
    if (!fs.existsSync(TEMP_DIR)) return;

    const files = fs.readdirSync(TEMP_DIR);
    const now = Date.now();
    let cleaned = 0;

    for (const file of files) {
      if (file === '.gitkeep') continue;

      const filePath = path.join(TEMP_DIR, file);

      try {
        const stats = fs.statSync(filePath);

        if (now - stats.mtimeMs > MAX_FILE_AGE_MS) {
          fs.unlinkSync(filePath);
          cleaned++;
        }
      } catch (err) {
        // Ignore errors for individual files
      }
    }

    if (cleaned > 0) {
      log(`Cleaned up ${cleaned} old file(s)`);
    }
  } catch (err) {
    log(`Cleanup error: ${err.message}`, 'error');
  }
}

module.exports = {
  TEMP_DIR,
  ensureTempDir,
  downloadFile,
  cleanupFiles,
  cleanupOldFiles
};
