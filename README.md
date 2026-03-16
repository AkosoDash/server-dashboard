# Server Dashboard

A Next.js dashboard for monitoring server metrics using Prometheus with Telegram alert notifications.

## Features

- Real-time CPU, RAM, disk, and network monitoring
- Docker container monitoring
- Temperature monitoring
- Telegram notifications for alerts

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure Prometheus URL in `.env.local`:

   ```
   PROMETHEUS_URL=http://your-prometheus-server:9090
   NEXT_PUBLIC_PROMETHEUS_URL=http://your-prometheus-server:9090
   ```

3. (Optional) Set up Telegram notifications:

   a. Create a Telegram bot:
   - Message @BotFather on Telegram
   - Send `/newbot` and follow instructions
   - Copy the bot token

   b. Get your chat ID:
   - Message your bot
   - Visit `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
   - Copy the chat ID from the response

   c. Add to `.env.local`:

   ```
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   TELEGRAM_CHAT_ID=your_chat_id_here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## Alert Thresholds

The system sends Telegram notifications when:

- CPU usage > 90%
- RAM usage > 90%
- Disk usage > 90%
- Temperature > 80°C

Alerts include both trigger notifications (🚨 ALERT) and resolution notifications (✅ RESOLVED) with a 30-minute cooldown to prevent spam.

## API Endpoints

- `/api/metrics` - Current metrics snapshot
- `/api/metrics-stream` - Real-time metrics stream
- `/api/test-telegram` - Sends a test Telegram message (use to confirm configuration)
