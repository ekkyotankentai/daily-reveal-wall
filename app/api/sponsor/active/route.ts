import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

async function fileExists(p: string) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  const metaPath = path.join(process.cwd(), "data", "sponsor.json");

  let active = false;
  let filename: string | null = null;

  try {
    const raw = await fs.readFile(metaPath, "utf-8");
    const meta = JSON.parse(raw);
    active = !!meta.active;
    filename = meta.filename ?? null;
  } catch {
    // sponsor.json が無い場合
  }

  if (active && filename) {
    const p = path.join(process.cwd(), "public", "sponsors", filename);
    if (await fileExists(p)) {
      return NextResponse.json({
        ok: true,
        kind: "SPONSORED",
        url: `/sponsors/${filename}`,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    kind: "DEMO",
    url: "/demo.png",
  });
}