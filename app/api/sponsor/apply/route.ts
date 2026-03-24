import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const companyName = String(formData.get("companyName") || "").trim();
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const website = String(formData.get("website") || "").trim();
    const note = String(formData.get("note") || "").trim();

    const file = formData.get("image") as File | null;

    let imageUrl = "";

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext =
        file.name.split(".").pop()?.toLowerCase() ||
        file.type.split("/").pop() ||
        "png";

      const safeExt = ext.replace(/[^a-z0-9]/g, "") || "png";
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${safeExt}`;

      const uploadDir = path.join(process.cwd(), "public", "uploads");
      fs.mkdirSync(uploadDir, { recursive: true });

      const savePath = path.join(uploadDir, fileName);
      fs.writeFileSync(savePath, buffer);

      imageUrl = `/uploads/${fileName}`;
    }

    const item = {
      id: randomUUID(),
      companyName,
      name,
      email,
      phone,
      website,
      note,
      imageUrl,
      createdAt: new Date().toISOString(),
    };

    const dataDir = path.join(process.cwd(), "data");
    fs.mkdirSync(dataDir, { recursive: true });

    const filePath = path.join(dataDir, "applications.jsonl");
    fs.appendFileSync(filePath, JSON.stringify(item) + "\n", "utf-8");

    return NextResponse.json({
      ok: true,
      message: "saved",
      item,
    });
  } catch (error) {
    console.error("APPLY ERROR:", error);
    return NextResponse.json(
      { ok: false, error: "save failed" },
      { status: 500 }
    );
  }
}