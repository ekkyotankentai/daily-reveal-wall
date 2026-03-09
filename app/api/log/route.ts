import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const LOG_PATH = path.join(process.cwd(), "data", "events.jsonl");

async function ensureDir() {
  await fs.mkdir(path.dirname(LOG_PATH), { recursive: true }).catch(() => {});
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    await ensureDir();

    const line = JSON.stringify({
      ts: new Date().toISOString(),
      ...body,
    });

    await fs.appendFile(LOG_PATH, line + "\n", "utf8");

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "unknown" }, { status: 500 });
  }
}

export async function GET() {
  try {
    await ensureDir();
    const raw = await fs.readFile(LOG_PATH, "utf8").catch(() => "");
    const lines = raw.trim() ? raw.trim().split("\n") : [];
    const last = lines.slice(-200).map((s) => JSON.parse(s));
    return NextResponse.json({ ok: true, count: lines.length, last });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "unknown" }, { status: 500 });
  }
}