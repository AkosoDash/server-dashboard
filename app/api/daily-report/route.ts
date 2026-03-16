import { NextResponse } from "next/server";
import { sendDailyReport } from "@/lib/daily-report";

export async function GET() {
  try {
    await sendDailyReport();
    return NextResponse.json({
      ok: true,
      message: "Daily report sent successfully. Check your Telegram chat.",
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 },
    );
  }
}
