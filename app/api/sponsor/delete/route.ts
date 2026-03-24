import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const id = String(formData.get("id") || "").trim();

    if (!id) {
      return NextResponse.redirect(new URL("/admin/applications", req.url));
    }

    const filePath = path.join(process.cwd(), "data", "applications.jsonl");

    if (!fs.existsSync(filePath)) {
      return NextResponse.redirect(new URL("/admin/applications", req.url));
    }

    const text = fs.readFileSync(filePath, "utf-8").trim();

    if (!text) {
      return NextResponse.redirect(new URL("/admin/applications", req.url));
    }

    const lines = text.split("\n").filter(Boolean);

    const items = lines
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    const filtered = items.filter((item: any) => item.id !== id);

    const nextText =
      filtered.length > 0
        ? filtered.map((item: any) => JSON.stringify(item)).join("\n") + "\n"
        : "";

    fs.writeFileSync(filePath, nextText, "utf-8");

    return NextResponse.redirect(new URL("/admin/applications", req.url));
  } catch (error) {
    console.error("DELETE ERROR:", error);
    return NextResponse.json(
      { ok: false, error: "delete failed" },
      { status: 500 }
    );
  }
}