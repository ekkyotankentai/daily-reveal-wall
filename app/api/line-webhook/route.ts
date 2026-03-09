import { NextResponse } from "next/server";

async function pushText(text: string) {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const userId = process.env.LINE_USER_ID;

  if (!channelAccessToken || !userId) {
    throw new Error("Missing env variables");
  }

  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${channelAccessToken}`,
    },
    body: JSON.stringify({
      to: userId,
      messages: [{ type: "text", text }],
    }),
  });

  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export async function POST(req: Request) {
  const body = await req.json();

  console.log("🔥 LINE Webhook受信");
  console.log(JSON.stringify(body, null, 2));

  const events = Array.isArray(body?.events) ? body.events : [];

  // 複数イベントが来てもOKにする
  for (const ev of events) {
    const type = ev?.type;
    const msgType = ev?.message?.type;
    const textRaw = ev?.message?.text ?? "";
    const text = String(textRaw).trim().toLowerCase();

    // セキュリティ：あなた以外からの操作を無効化（送信元userIdが取れる場合）
    const fromUserId = ev?.source?.userId;
    const allowedUserId = process.env.LINE_USER_ID;
    if (allowedUserId && fromUserId && fromUserId !== allowedUserId) {
      console.log("⛔ Unauthorized user:", fromUserId);
      continue;
    }

    // ✅ コマンド：notify
    if (type === "message" && msgType === "text" && text === "notify") {
      const result = await pushText(
        [
          "🧱 Daily Reveal Wall",
          "🔔 手動通知（notifyコマンド）",
          `📅 ${new Date().toISOString()}`,
        ].join("\n")
      );

      console.log("✅ push result:", result);
    }

    // （任意）pingで動作確認
    if (type === "message" && msgType === "text" && text === "ping") {
      const result = await pushText("pong ✅");
      console.log("✅ push result:", result);
    }
  }

  return NextResponse.json({ status: "ok" });
}