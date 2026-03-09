import { NextResponse } from "next/server";

export async function GET() {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const userId = process.env.LINE_USER_ID;

  if (!channelAccessToken || !userId) {
    return NextResponse.json({ ok: false, error: "Missing env variables" });
  }

  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${channelAccessToken}`,
    },
    body: JSON.stringify({
      to: userId,
      messages: [
  {
    type: "text",
    text: [
      "🧱 Daily Reveal Wall",
      "✅ 新しいスポンサー枠が公開されました",
      "📅 2026-02-28",
      "🔗 http://localhost:3000"
    ].join("\n"),
  },
],
    }),
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json({ ok: res.ok, data }, { status: res.status });
}