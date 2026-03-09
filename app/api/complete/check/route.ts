import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { openedCount, totalCount = 300, slotId = "today" } = body;

    if (typeof openedCount !== "number") {
      return NextResponse.json({ ok: false, error: "openedCount is required (number)" }, { status: 400 });
    }

    const isComplete = openedCount >= totalCount;

    // 完成していなければ何もしない
    if (!isComplete) {
      return NextResponse.json({ ok: true, complete: false });
    }

    // ✅ 完成したら管理者にLINE通知（既存の /api/notify を使う）
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      "http://localhost:3000"; // ローカル用 fallback

    const res = await fetch(`${baseUrl}/api/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `🧱 Daily Reveal Wall\n✅ 300マス完成！\nslot: ${slotId}\nopened: ${openedCount}/${totalCount}`,
      }),
    });

    const j = await res.json().catch(() => ({}));

    return NextResponse.json({ ok: true, complete: true, notify: j });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "unknown error" }, { status: 500 });
  }
}