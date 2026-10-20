"use client";

import { useEffect, useRef, useState } from "react";
import { FileWarning } from "lucide-react";
import { fetchPreview } from "@/lib/client/api";

const PAGE_WIDTH = 360;

// הגבלת הורדות מקבילות כדי לא להעמיס על הדרייב כשיש הרבה מסמכים
let active = 0;
const waiting: Array<() => void> = [];
const MAX_PARALLEL = 3;

function acquire(): Promise<void> {
  if (active < MAX_PARALLEL) {
    active++;
    return Promise.resolve();
  }
  return new Promise((resolve) => waiting.push(() => { active++; resolve(); }));
}
function release() {
  active--;
  waiting.shift()?.();
}

const htmlCache = new Map<string, string>();

/** תמונה מוקטנת של עמוד ראשון מתוך המסמך, כפי שהוא נראה על הנייר */
export function DocPreview({ fileId }: { fileId: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState<string | null>(htmlCache.get(fileId) ?? null);
  const [error, setError] = useState(false);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / PAGE_WIDTH);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (htmlCache.has(fileId)) return;
    let cancelled = false;
    (async () => {
      await acquire();
      try {
        const res = await fetchPreview(fileId, "thumb");
        if (cancelled) return;
        htmlCache.set(fileId, res.html);
        setHtml(res.html);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        release();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fileId]);

  return (
    <div
      ref={boxRef}
      className="paper pointer-events-none relative h-full w-full overflow-hidden rounded-xl"
    >
      {html ? (
        <>
          <div
            className="docx-content-page absolute right-0 top-0 origin-top-right"
            style={{
              width: PAGE_WIDTH,
              padding: "24px 26px",
              fontSize: 16,
              transform: `scale(${scale})`,
            }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#fffdf8] via-[#fffdf8]/85 to-transparent" />
        </>
      ) : error ? (
        <div className="flex h-full flex-col items-center justify-center gap-2 bg-slate-100 text-slate-500">
          <FileWarning className="h-8 w-8" />
          <span className="text-xs font-semibold">תצוגה מקדימה אינה זמינה</span>
        </div>
      ) : (
        <div className="flex h-full flex-col gap-2.5 p-4" aria-label="טוען עמוד ראשון">
          <div className="h-3 w-2/5 self-center animate-pulse rounded-full bg-slate-200" />
          {[100, 92, 96, 88, 94, 70, 90, 84].map((w, i) => (
            <div
              key={i}
              className="h-2 animate-pulse rounded-full bg-slate-200"
              style={{ width: `${w}%`, animationDelay: `${i * 90}ms` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
