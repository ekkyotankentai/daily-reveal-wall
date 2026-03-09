import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";

type EventRow = {
  ts?: string;
  event?: string;
  slotId?: string;
  mode?: string;
  idx?: number;
  openedCount?: number;
};

function getLogFilePath() {
  return path.join(process.cwd(), "data", "events.jsonl");
}

export async function GET(req: NextRequest) {
  try {
    const slotId = req.nextUrl.searchParams.get("slotId");

    if (!slotId) {
      return NextResponse.json(
        { ok: false, error: "slotId is required" },
        { status: 400 }
      );
    }

    const filePath = getLogFilePath();

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({
        ok: true,
        slotId,
        opened: [],
        openedCount: 0,
      });
    }

    const raw = fs.readFileSync(filePath, "utf8");
    const lines = raw.split("\n").filter(Boolean);

    const openedSet = new Set<number>();

    for (const line of lines) {
      try {
        const row = JSON.parse(line) as EventRow;
        if (
          row.event === "OPEN" &&
          row.slotId === slotId &&
          typeof row.idx === "number"
        ) {
          openedSet.add(row.idx);
        }
      } catch {
        // ignore broken line
      }
    }

    const opened = Array.from(openedSet).sort((a, b) => a - b);

    return NextResponse.json({
      ok: true,
      slotId,
      opened,
      openedCount: opened.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "unknown error",
      },
      { status: 500 }
    );
  }
}