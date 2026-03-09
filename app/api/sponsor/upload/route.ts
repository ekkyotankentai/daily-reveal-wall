import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

const MAX_BYTES = 3 * 1024 * 1024; // 2MB
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

function extFromMime(mime: string) {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return null;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "file is required" }, { status: 400 });
    }

    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { ok: false, error: `Unsupported type: ${file.type}. Allow: jpeg/png/webp` },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { ok: false, error: `File too large: ${file.size} bytes (max ${MAX_BYTES})` },
        { status: 400 }
      );
    }

    const ext = extFromMime(file.type);
    if (!ext) {
      return NextResponse.json({ ok: false, error: "Cannot determine extension" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const filename = `sponsor-${Date.now()}.${ext}`;
    const dest = path.join(process.cwd(), "public", "sponsors", filename);

    await fs.writeFile(dest, bytes);

    // sponsor.json を更新（アップしたらactive=trueにする）
    const metaPath = path.join(process.cwd(), "data", "sponsor.json");
    const meta = {
      active: true,
      filename,
      updatedAt: new Date().toISOString(),
    };
    await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), "utf-8");

    await fetch("http://localhost:3000/api/notify?text=画像アップロード成功");
    return NextResponse.json({ ok: true, filename, url: `/sponsors/${filename}` });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "unknown error" }, { status: 500 });
  }
}