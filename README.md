# Video to Circle Bot

Telegram bot that converts any video to video notes (circles) with audio support.

**Live bot:** [@m0sthatedmancircle_bot](https://t.me/m0sthatedmancircle_bot)

**Repository:** [github.com/baranskyi/video-to-circle-bot](https://github.com/baranskyi/video-to-circle-bot)

## Features

- Convert any video to Telegram video note (circle) format
- **Audio preserved** - circles come with sound
- Automatic cropping to square (centered)
- Auto-trim videos longer than 60 seconds
- **Smart compression** - 4 levels of quality adjustment to fit size limits
- Fallback to regular video if video notes are blocked by privacy settings
- Rate limiting (5 requests per minute per user)

## Tech Stack

- **Runtime:** Node.js 18+
- **Bot Framework:** Telegraf 4.x
- **Video Processing:** FFmpeg + fluent-ffmpeg
- **Hosting:** Railway
- **Container:** Docker (Alpine Linux)

## How It Works

```
User sends video
       ↓
Download from Telegram API
       ↓
FFmpeg conversion:
  • Crop to square (centered)
  • Scale to 384px (or smaller if needed)
  • H.264 video + AAC audio
  • Trim to 60 seconds max
       ↓
Check output size (<8 MB?)
  • Yes → Send as video note
  • No → Try more aggressive compression
       ↓
Send video note (or fallback to regular video)
       ↓
Cleanup temp files
```

## Compression Levels

Bot automatically tries progressively more aggressive compression:

| Level | Resolution | CRF | Preset |
|-------|------------|-----|--------|
| 1 | 384x384 | 28 | fast |
| 2 | 320x320 | 32 | medium |
| 3 | 256x256 | 35 | medium |
| 4 | 240x240 | 38 | slow |

## Limitations

| Parameter | Value |
|-----------|-------|
| Max input file | 20 MB (Telegram Bot API limit) |
| Max output file | 8 MB (video note limit) |
| Max duration | 60 seconds |
| Output format | MP4 (H.264 + AAC) |

**Tip:** Send video as "video" (not as "file") - Telegram will compress large files automatically.

## Local Development

### Prerequisites

- Node.js 18+
- FFmpeg installed
  - Arch Linux: `sudo pacman -S ffmpeg`
  - Ubuntu/Debian: `sudo apt install ffmpeg`
  - macOS: `brew install ffmpeg`

### Setup

```bash
# Clone repository
git clone https://github.com/baranskyi/video-to-circle-bot.git
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

1. Open Telegram and find [@BotFather](https://t.me/BotFather)
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

Railway automatically builds using Dockerfile (includes FFmpeg).

### Railway CLI

```bash
npm install -g @railway/cli
railway login
railway link
railway logs      # View logs
railway variables # Manage env vars
```

## Project Structure

```
video-to-circle-bot/
├── src/
│   ├── index.js            # Entry point, graceful shutdown
│   ├── bot.js              # Telegraf setup, middleware
│   ├── handlers/
│   │   ├── commands.js     # /start, /help commands
│   │   └── video.js        # Video processing handler
│   ├── services/
│   │   └── converter.js    # FFmpeg conversion with compression levels
│   └── utils/
│       ├── fileManager.js  # Download, cleanup temp files
│       ├── validators.js   # Input validation
│       ├── rateLimit.js    # Rate limiting middleware
│       └── logger.js       # Timestamped logging
├── temp/                   # Temporary files (gitignored)
├── Dockerfile              # Alpine + FFmpeg
├── railway.json            # Railway config
├── package.json
└── README.md
```

## FFmpeg Command

```bash
ffmpeg -i input.mp4 \
  -vf "crop=min(iw,ih):min(iw,ih):(iw-min(iw,ih))/2:(ih-min(iw,ih))/2,scale=384:384" \
  -c:v libx264 -preset fast -crf 28 \
  -c:a aac -b:a 128k \
  -t 60 -movflags +faststart -pix_fmt yuv420p \
  output.mp4
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BOT_TOKEN` | Yes | Telegram bot token from @BotFather |
| `NODE_ENV` | No | `production` or `development` |

## Troubleshooting

### "VOICE_MESSAGES_FORBIDDEN" error
User has privacy settings blocking video notes. Bot will fallback to sending regular video with explanation.

### "File is too big" error
Telegram Bot API limit is 20 MB. Send video as "video" (not file) so Telegram compresses it first.

### Video note has no audio
Make sure you're using the latest version with AAC audio support.

## License

MIT

---

Built with Claude Code
