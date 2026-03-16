import { NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram";

export async function GET() {
  try {
    await sendTelegramMessage(
      "✅ Test message from Server Dashboard: Telegram integration works!",
    );
    return NextResponse.json({
      ok: true,
      message: "Test Telegram message sent (check your chat).",
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 },
    );
  }
}
