import fs from "fs";
import path from "path";

export async function GET() {
  const dataFile = path.join(process.cwd(), "data", "applications.jsonl");

  if (!fs.existsSync(dataFile)) {
    return new Response("no data", { status: 404 });
  }

  const lines = fs
    .readFileSync(dataFile, "utf-8")
    .split("\n")
    .filter((l) => l.trim() !== "");

  const rows = lines.map((line) => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  }).filter(Boolean);

  const header = [
    "createdAt",
    "company",
    "name",
    "email",
    "phone",
    "memo",
    "image",
  ];

  const csv = [
    header.join(","),
    ...rows.map((r: any) =>
      [
        r.createdAt || "",
        r.company || "",
        r.name || "",
        r.email || "",
        r.phone || "",
        (r.memo || "").replace(/,/g, " "),
        r.image || "",
      ].join(",")
    ),
  ].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=applications.csv",
    },
  });
}