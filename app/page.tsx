"use client";

import React, { useEffect, useMemo, useState } from "react";

type Mode = "SPONSORED" | "DEMO";

const DEMO_COLS = 10;
const DEMO_ROWS = 10;

const SPON_COLS = 20;
const SPON_ROWS = 15;

const FREE_REVEALS = 3;
const DEMO_RATIO = 0.8;

const DEMO_URL = "/daily/demo.png";

const LS_PREFIX = "drw:sponsored:";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function getSlotId(d: Date) {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(
    d.getUTCDate()
  )}-${pad(d.getUTCHours())}Z`;
}

function makeDeterministicBase(slotId: string, total: number, ratio: number) {
  const count = Math.floor(total * ratio);
  const seed = Array.from(slotId).reduce((a, c) => a + c.charCodeAt(0), 0);
  let x = seed || 123456789;

  const rand = () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 4294967296;
  };

  const base = new Set<number>();
  while (base.size < count) {
    base.add(Math.floor(rand() * total));
  }
  return base;
}

function lsKey(slotId: string) {
  return `${LS_PREFIX}${slotId}:${SPON_COLS}x${SPON_ROWS}`;
}

function loadSponsored(slotId: string): Set<number> {
  try {
    const raw = localStorage.getItem(lsKey(slotId));
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function saveSponsored(slotId: string, indices: Set<number>) {
  try {
    localStorage.setItem(lsKey(slotId), JSON.stringify(Array.from(indices)));
  } catch {}
}

export default function Page() {
  const [now, setNow] = useState(() => new Date());
  const slotId = useMemo(() => getSlotId(now), [now]);

  const [mode, setMode] = useState<Mode>("DEMO");
  const [imageUrl, setImageUrl] = useState<string>(DEMO_URL);

  const [demoBase, setDemoBase] = useState<Set<number>>(new Set());
  const [demoUser, setDemoUser] = useState<Set<number>>(new Set());
  const [sponsored, setSponsored] = useState<Set<number>>(new Set());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/sponsor/active", { cache: "no-store" });
        const data = await res.json();

        const kind = (data?.kind as Mode) ?? "DEMO";
        const url = (data?.url as string) ?? DEMO_URL;

        setMode(kind);
        setImageUrl(url);

        if (kind === "SPONSORED") {
          setSponsored(loadSponsored(slotId));
          setDemoBase(new Set());
          setDemoUser(new Set());
        } else {
          const total = DEMO_COLS * DEMO_ROWS;
          setDemoBase(makeDeterministicBase(slotId, total, DEMO_RATIO));
          setDemoUser(new Set());
          setSponsored(new Set());
        }
      } catch {
        setMode("DEMO");
        setImageUrl(DEMO_URL);
        const total = DEMO_COLS * DEMO_ROWS;
        setDemoBase(makeDeterministicBase(slotId, total, DEMO_RATIO));
        setDemoUser(new Set());
        setSponsored(new Set());
      }
    }

    init();
  }, [slotId]);

  function logEvent(event: string, data: Record<string, unknown> = {}) {
    fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, slotId, mode, ...data }),
    }).catch(() => {});
  }

  useEffect(() => {
    if (mode !== "SPONSORED") return;

    const key = `notified-${slotId}`;

    if (!localStorage.getItem(key)) {
      logEvent("SPONSOR_PUBLISHED");

      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `🧱 Daily Reveal Wall\n🔔 スポンサー公開！\n📅 ${new Date().toISOString()}`,
        }),
      }).catch(() => {});

      localStorage.setItem(key, "1");
    }
  }, [mode, slotId]);

  const grid = useMemo(() => {
    if (mode === "SPONSORED") {
      return { cols: SPON_COLS, rows: SPON_ROWS, total: SPON_COLS * SPON_ROWS };
    }
    return { cols: DEMO_COLS, rows: DEMO_ROWS, total: DEMO_COLS * DEMO_ROWS };
  }, [mode]);

  const revealed = useMemo(() => {
    const s = new Set<number>();

    if (mode === "DEMO") {
      for (const i of demoBase) s.add(i);
      for (const i of demoUser) s.add(i);
    } else {
      for (const i of sponsored) s.add(i);
    }

    return s;
  }, [mode, demoBase, demoUser, sponsored]);

  const freeLeft = useMemo(() => {
    const used = mode === "DEMO" ? demoUser.size : sponsored.size;
    return Math.max(0, FREE_REVEALS - used);
  }, [mode, demoUser.size, sponsored.size]);

  function onClick(idx: number) {
    if (revealed.has(idx)) return;
    if (freeLeft <= 0) return;

    if (mode === "DEMO") {
      setDemoUser((prev) => {
        const next = new Set(prev);
        next.add(idx);
        return next;
      });
      return;
    }

    const openKey = `open-logged-${slotId}-${idx}`;

    setSponsored((prev) => {
      const next = new Set(prev);
      next.add(idx);
      saveSponsored(slotId, next);

      if (!localStorage.getItem(openKey)) {
        logEvent("OPEN", { idx, openedCount: next.size });
        localStorage.setItem(openKey, "1");
      }

      if (next.size >= 300) {
        const completeKey = `complete-notified-${slotId}`;

        if (!localStorage.getItem(completeKey)) {
          fetch("/api/complete/check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              openedCount: next.size,
              totalCount: 300,
              slotId,
            }),
          }).catch(() => {});

          localStorage.setItem(completeKey, "1");
        }
      }

      return next;
    });
  }

  function cellStyle(idx: number): React.CSSProperties {
    const cols = grid.cols;
    const rows = grid.rows;
    const r = Math.floor(idx / cols);
    const c = idx % cols;

    return {
      backgroundImage: `url(${imageUrl})`,
      backgroundSize: `${cols * 100}% ${rows * 100}%`,
      backgroundPosition: `${(c / Math.max(cols - 1, 1)) * 100}% ${(r / Math.max(rows - 1, 1)) * 100}%`,
      backgroundRepeat: "no-repeat",
    };
  }

  return (
    <div style={{ background: "#111", color: "#fff", minHeight: "100vh" }}>
      <div style={{ padding: 12 }}>
        <div>
          <b>Slot:</b> {slotId}
        </div>
        <div>
          <b>Mode:</b> {mode}
        </div>
        <div>
          <b>Revealed:</b> {revealed.size} / {grid.total}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
          gap: 4,
          padding: 20,
        }}
      >
        {Array.from({ length: grid.total }).map((_, idx) => {
          const isOpen = revealed.has(idx);

          return (
            <button
              key={idx}
              onClick={() => onClick(idx)}
              style={{
                aspectRatio: "1 / 1",
                background: isOpen ? "transparent" : "#2a2a2a",
                border: "1px solid #333",
                padding: 0,
                overflow: "hidden",
              }}
            >
              {isOpen && (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    ...cellStyle(idx),
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {revealed.size >= 300 && (
        <div style={{ textAlign: "center", padding: 40 }}>
          <h2>🎉 COMPLETE</h2>
          <a
            href="https://example.com"
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-block",
              marginTop: 20,
              padding: "12px 24px",
              background: "#fff",
              color: "#000",
              textDecoration: "none",
              borderRadius: 8,
            }}
          >
            スポンサーサイトを見る
          </a>
        </div>
      )}
    </div>
  );
}