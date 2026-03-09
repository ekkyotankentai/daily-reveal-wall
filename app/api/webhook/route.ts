export async function POST(req: Request) {
  const body = await req.json();

  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const admin = process.env.LINE_ADMIN_USER_ID;

  const replyToken = body.events?.[0]?.replyToken;

  const text =
    body.events?.[0]?.message?.type === "text"
      ? body.events?.[0]?.message?.text
      : "";

  const isNotify = text.startsWith("notify:");

  try {
    if (!token) return new Response("Missing LINE_CHANNEL_ACCESS_TOKEN", { status: 200 });

    // 送信者へ返信（常に返す）
    if (replyToken) {
      await fetch("https://api.line.me/v2/bot/message/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          replyToken,
          messages: [
            {
              type: "text",
              text: isNotify
                ? "通知しました"
                : "受信しました（通知するなら notify: を先頭に付けてください）",
            },
          ],
        }),
      });
    }

    // 管理者へpush（notify: のときだけ）
    if (admin && isNotify) {
      const msg = text.replace(/^notify:\s*/, "");
      await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: admin,
          messages: [{ type: "text", text: `🧱 Daily Reveal Wall\n📩 ${msg || "(空)"}` }],
        }),
      });
    }

    return new Response("OK", { status: 200 });
  } catch {
    return new Response("OK", { status: 200 });
  }
}