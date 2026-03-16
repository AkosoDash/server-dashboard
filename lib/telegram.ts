const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

const TELEGRAM_API_BASE = botToken
  ? `https://api.telegram.org/bot${botToken}`
  : undefined;

function isTelegramConfigured() {
  return Boolean(botToken && chatId && TELEGRAM_API_BASE);
}

export async function sendTelegramMessage(
  message: string,
  options?: { parseMode?: "Markdown" | "HTML" },
): Promise<void> {
  if (!isTelegramConfigured()) {
    console.warn(
      "Telegram bot not configured. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env.local",
    );
    return;
  }

  const text = (message || "").toString().trim();
  if (!text) {
    throw new Error("Telegram message is empty");
  }

  try {
    const payload: any = {
      chat_id: chatId,
      text,
    };

    if (options?.parseMode) {
      payload.parse_mode = options.parseMode;
    }

    const res = await fetch(`${TELEGRAM_API_BASE}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!data || !data.ok) {
      throw new Error(
        `Telegram API error: ${data?.description ?? "unknown"} (code: ${data?.error_code})`,
      );
    }

    console.log("Telegram notification sent:", text);
  } catch (error) {
    console.error("Failed to send Telegram message:", error);
    throw error;
  }
}

// Alert thresholds
export const ALERT_THRESHOLDS = {
  CPU_USAGE: 90, // %
  RAM_USAGE: 90, // %
  DISK_USAGE: 90, // %
  TEMPERATURE: 80, // °C
};

// Simple alert state management (in production, use a database)
const alertStates: Record<string, { lastAlert: number; isActive: boolean }> =
  {};

export async function checkAndSendAlert(
  alertKey: string,
  condition: boolean,
  message: string,
  cooldownMinutes: number = 30,
): Promise<void> {
  const now = Date.now();
  const state = alertStates[alertKey] || { lastAlert: 0, isActive: false };

  if (condition) {
    if (
      !state.isActive ||
      now - state.lastAlert > cooldownMinutes * 60 * 1000
    ) {
      await sendTelegramMessage(`🚨 ALERT: ${message}`);
      state.lastAlert = now;
      state.isActive = true;
    }
  } else {
    if (state.isActive) {
      await sendTelegramMessage(`✅ RESOLVED: ${message}`);
      state.isActive = false;
    }
  }

  alertStates[alertKey] = state;
}
