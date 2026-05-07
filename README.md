# Telegram Cloud Mirror Bot

A production-ready Telegram bot for mirroring files from various sources (Direct Links, SourceForge, Magnet/Torrent) to cloud storage (Google Drive, AWS S3, Dropbox, etc.) using Node.js, TypeScript, Aria2c, and Rclone.

## Features

- **Multi-source support**: HTTP/HTTPS, SourceForge, Magnet links, Torrent files
- **Multi-destination**: 70+ cloud providers via Rclone
- **Queue system**: BullMQ + Redis with priority queues and exponential backoff
- **Fault tolerance**: Circuit breakers, retry logic, dead letter queues
- **Observability**: Structured logging (Pino), health checks, Prometheus metrics ready
- **Type-safe**: Full TypeScript with Zod validation
- **Production-ready**: Docker support, graceful shutdown, WAL-mode SQLite

## Prerequisites

- Node.js 20 LTS+
- Redis 7.x
- Aria2c 1.37+
- Rclone 1.66+
- Telegram Bot Token (from @BotFather)

## Quick Start

1. Clone the repository:
```bash
git clone <repo-url>
cd telegram-cloud-mirror-bot
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your tokens and configuration
```

4. Setup Rclone remote:
```bash
rclone config
```

5. Start services:
```bash
# Start Aria2c
aria2c --enable-rpc --rpc-listen-all=true --rpc-secret=your_secret

# Start Rclone RC
rclone rcd --rc-addr=0.0.0.0:5572 --rc-user=admin --rc-pass=admin

# Start Redis
redis-server
```

6. Run the bot:
```bash
npm run dev
```

## Docker Deployment

```bash
docker-compose -f docker/docker-compose.yml up -d
```

## Usage

```
/mirror <url> - Mirror a file to cloud storage
/status [job_id] - Check job status
/cancel <job_id> - Cancel a job
/quota - Check your daily quota
/help - Show help message
```

## Architecture

```
src/
├── bot/           # Telegram bot handlers and middleware
├── services/      # Core services (Aria2c, Rclone, Queue)
├── workers/       # BullMQ job processors
├── database/      # SQLite schema and migrations
├── types/         # TypeScript/Zod type definitions
├── utils/         # Logger, errors, helpers
├── config/        # Configuration management
├── health/        # Health check endpoint
└── index.ts       # Main entrypoint
```

## Configuration

Copy the example file and edit it with your values:

```bash
cp .env.example .env
nano .env  # or your preferred editor
```

### Required Variables

| Variable | Description | How to Get |
|----------|-------------|------------|
| `TELEGRAM_BOT_TOKEN` | Your Telegram bot token | Talk to [@BotFather](https://t.me/BotFather) on Telegram, send `/newbot`, follow prompts. Copy the token. |
| `ARIA2C_RPC_SECRET` | Secret for Aria2c RPC | Choose any strong password/string. Used when starting aria2c with `--rpc-secret=your_secret`. |
| `RCLONE_RC_USER` | Username for Rclone RC API | Choose a username (default: `admin`). |
| `RCLONE_RC_PASS` | Password for Rclone RC API | Choose a strong password (default: `admin`). |

### Telegram Webhook (Optional)

| Variable | Description |
|----------|-------------|
| `WEBHOOK_URL` | `https://your-domain.com/telegram-webhook` - Set this for production (webhook mode). Leave empty for development (long-polling mode). |
| `WEBHOOK_SECRET` | Secret path for webhook verification (optional). |

### Redis Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_URL` | `redis://localhost:6379` | Redis connection URL. Use `redis://:password@host:port` if Redis has a password. |
| `REDIS_PASSWORD` | (empty) | Redis password if required. |

### Aria2c Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `ARIA2C_RPC_URL` | `ws://localhost:6800/jsonrpc` | WebSocket URL for Aria2c RPC. |
| `ARIA2C_MAX_CONCURRENT` | `5` | Max concurrent downloads. |
| `ARIA2C_SPLIT` | `16` | Number of connections per download. |
| `ARIA2C_MIN_SPLIT_SIZE` | `10M` | Minimum file size to split (e.g., `10M` = 10MB). |

**Starting Aria2c:**
```bash
aria2c --enable-rpc --rpc-listen-all=true --rpc-secret=YOUR_SECRET
```

### Rclone Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `RCLONE_RC_URL` | `http://localhost:5572` | Rclone RC API URL. |
| `RCLONE_RC_USER` | `admin` | Rclone RC username. |
| `RCLONE_RC_PASS` | `admin` | Rclone RC password. |

**Setting up Rclone:**
```bash
# Configure a remote (e.g., Google Drive)
rclone config

# Start Rclone RC server
rclone rcd --rc-addr=0.0.0.0:5572 --rc-user=YOUR_USER --rc-pass=YOUR_PASS
```

### Database

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_PATH` | `./data/mirrorbot.db` | Path to SQLite database file. Directory will be created automatically. |

### Application

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Set to `production` for production deployment. |
| `LOG_LEVEL` | `info` | Log level: `trace`, `debug`, `info`, `warn`, `error`. |
| `PORT` | `3000` | Port for the health check HTTP server. |

### Queue Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `QUEUE_MAX_JOBS` | `1000` | Max pending jobs in queue before rejecting new ones. |
| `QUEUE_REMOVE_ON_COMPLETE` | `100` | Keep last N completed jobs in Redis. |
| `QUEUE_REMOVE_ON_FAIL` | `50` | Keep last N failed jobs in Redis. |

### User Quotas (in bytes)

| Variable | Default | Description |
|----------|---------|-------------|
| `DEFAULT_USER_QUOTA_DAILY` | `10737418240` | Daily quota for free users (~10GB). |
| `PREMIUM_USER_QUOTA_DAILY` | `1099511627776` | Daily quota for premium users (~1TB). |

### Rate Limiting (requests per hour)

| Variable | Default | Description |
|----------|---------|-------------|
| `RATE_LIMIT_FREE` | `5` | Max requests/hour for free users. |
| `RATE_LIMIT_PREMIUM` | `50` | Max requests/hour for premium users. |
| `RATE_LIMIT_ADMIN` | `0` | Max requests/hour for admins (`0` = unlimited). |

### Example .env File

```env
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
ARIA2C_RPC_SECRET=my_strong_secret
RCLONE_RC_USER=admin
RCLONE_RC_PASS=my_rclone_password

# Optional
WEBHOOK_URL=https://my-domain.com/telegram-webhook
NODE_ENV=production
LOG_LEVEL=info
```

## License

MIT
