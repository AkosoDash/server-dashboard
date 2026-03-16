# Server Dashboard

A Next.js dashboard for monitoring server metrics using Prometheus with Telegram alert notifications.

## Features

- Real-time CPU, RAM, disk, and network monitoring
- Docker container monitoring
- Temperature monitoring
- Telegram notifications for system alerts
- **Daily performance reports via Telegram**

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

## Daily Reports

The system can send automated daily performance reports via Telegram.

### Manual Report

To send a report immediately:

```
GET /api/daily-report
```

### Automated Reports (Cron Setup)

1. **Test the script manually first:**

   ```bash
   cd /Users/abimanyuprakoso/Desktop/my-experiment/ma-server/server-dashboard
   node scripts/daily-report.js
   ```

2. **Set up daily cron job (runs at 9 AM daily):**

   ```bash
   crontab -e
   ```

   Add this line:

   ```
   0 9 * * * cd /Users/abimanyuprakoso/Desktop/my-experiment/ma-server/server-dashboard && node scripts/daily-report.js
   ```

   Or for a different time (e.g., 8 PM):

   ```
   0 20 * * * cd /Users/abimanyuprakoso/Desktop/my-experiment/ma-server/server-dashboard && node scripts/daily-report.js
   ```

### Report Contents

- CPU: Average and peak usage over 24 hours
- Memory: Average and peak usage over 24 hours
- Disk: Current usage and capacity
- Network: Total data transferred in 24 hours
- Containers: Top 5 by memory usage
- Temperatures: All sensor readings

## API Endpoints

- `/api/metrics` - Current metrics snapshot
- `/api/metrics-stream` - Real-time metrics stream
- `/api/test-telegram` - Sends a test Telegram message (use to confirm configuration)
- `/api/daily-report` - Generates and sends a comprehensive daily performance report via Telegram
