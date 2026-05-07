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

See `.env.example` for all available configuration options.

## License

MIT
