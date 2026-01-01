const WELCOME_MESSAGE = `
Welcome to Video to Circle Bot!

Send me any video and I'll convert it to a video note (circle).

Limitations:
- Max file size: 20 MB
- Max duration: 60 seconds (longer videos will be trimmed)
- Output: 384x384 square video (displayed as circle in Telegram)

Just send a video file or forward a video message!
`;

const HELP_MESSAGE = `
How to use this bot:

1. Send any video file (MP4, MOV, AVI, etc.)
2. Wait for processing (usually 10-30 seconds)
3. Receive your video note (circle)!

Limitations:
- Maximum input file size: 20 MB (Telegram limit)
- Maximum video duration: 60 seconds
- Videos longer than 60 sec will be automatically trimmed
- The video will be cropped to a square (centered)
- Output resolution: 384x384 pixels

Tips:
- For best results, use videos already close to square format
- Shorter videos process faster
- If output is too large, try a shorter video

Having issues? The video might be in an unsupported format.
`;

function setupCommands(bot) {
  bot.command('start', (ctx) => {
    ctx.reply(WELCOME_MESSAGE);
  });

  bot.command('help', (ctx) => {
    ctx.reply(HELP_MESSAGE);
  });
}

module.exports = { setupCommands };
