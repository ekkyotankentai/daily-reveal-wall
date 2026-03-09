import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text } = await req.json().catch(() => ({ text: "" }));

    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const to = process.env.LINE_ADMIN_USER_ID;

    if (!token) {
      return NextResponse.json({ ok: false, error: "Missing LINE_CHANNEL_ACCESS_TOKEN" }, { status: 500 });
    }
    if (!to) {
      return NextResponse.json({ ok: false, error: "Missing LINE_ADMIN_USER_ID" }, { status: 500 });
    }

    const messageText = (text && String(text)) || "通知テスト";

    const r = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to,
        messages: [{ type: "text", text: messageText }],
      }),
    });

    if (!r.ok) {
      const detail = await r.text().catch(() => "");
      return NextResponse.json(
        { ok: false, error: `LINE push failed: ${r.status}`, detail },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
export async function GET(req: Request) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const admin = process.env.LINE_ADMIN_USER_ID;

  if (!token || !admin) {
    return new Response("Missing env", { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const text = searchParams.get("text") || "GET通知テスト";

  await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      to: admin,
      messages: [{ type: "text", text }],
    }),
  });

  return new Response("OK");
}