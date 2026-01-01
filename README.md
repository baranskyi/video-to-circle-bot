# Video to Circle Bot

Telegram bot that converts any video to video notes (circles).

## Features

- Convert any video to Telegram video note format
- Automatic cropping to square (centered)
- Auto-trim videos longer than 60 seconds
- Rate limiting (5 requests per minute per user)
- Automatic retry with lower quality if output is too large

## Tech Stack

- Node.js 18+
- Telegraf (Telegram Bot Framework)
- FFmpeg (video processing)
- Railway (hosting)

## Limitations

| Parameter | Value |
|-----------|-------|
| Max input file | 20 MB (Telegram API limit) |
| Max output file | 8 MB (video note limit) |
| Max duration | 60 seconds |
| Output resolution | 384x384 pixels |

## Local Development

### Prerequisites

- Node.js 18+
- FFmpeg installed (`sudo pacman -S ffmpeg` on Arch Linux)

### Setup

```bash
# Clone repository
git clone https://github.com/yourusername/video-to-circle-bot.git
cd video-to-circle-bot

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env and add your BOT_TOKEN

# Run in development mode
npm run dev
```

### Get Bot Token

1. Open Telegram and find @BotFather
2. Send `/newbot`
3. Follow instructions to create bot
4. Copy the token to `.env`

## Deployment (Railway)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create video-to-circle-bot --public --source=. --push
```

### 2. Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select `video-to-circle-bot`
4. Add environment variable: `BOT_TOKEN` = your token
5. Deploy!

Railway will automatically build using Dockerfile (which includes FFmpeg).

## Project Structure

```
video-to-circle-bot/
├── src/
│   ├── index.js            # Entry point
│   ├── bot.js              # Telegraf setup
│   ├── handlers/
│   │   ├── commands.js     # /start, /help
│   │   └── video.js        # Video processing
│   ├── services/
│   │   └── converter.js    # FFmpeg conversion
│   └── utils/
│       ├── fileManager.js  # Temp file management
│       ├── validators.js   # Input validation
│       ├── rateLimit.js    # Rate limiting
│       └── logger.js       # Logging
├── temp/                   # Temporary files
├── Dockerfile
├── railway.json
├── package.json
└── README.md
```

## How It Works

1. User sends video to bot
2. Bot validates file size (max 20 MB)
3. Downloads video from Telegram servers
4. FFmpeg converts video:
   - Crops to square (centered)
   - Scales to 384x384
   - Encodes with H.264
   - Trims to 60 seconds
   - Removes audio
5. Bot sends result as video note
6. Cleans up temporary files

## FFmpeg Command

```bash
ffmpeg -i input.mp4 \
  -vf "crop=min(iw,ih):min(iw,ih):(iw-min(iw,ih))/2:(ih-min(iw,ih))/2,scale=384:384" \
  -c:v libx264 -preset fast -crf 28 \
  -t 60 -an -movflags +faststart \
  output.mp4
```

## License

MIT
