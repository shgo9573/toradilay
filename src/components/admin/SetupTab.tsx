"use client";

import { useState } from "react";
import { Check, Copy, Monitor, Power, ShieldAlert } from "lucide-react";
import { FxButton } from "../FxButton";
import { SectionCard } from "./ui";

const EDGE_CMD =
  'msedge.exe --app=http://127.0.0.1:3000 --kiosk-printing --disable-extensions --no-first-run --disable-features=Translate';
const CHROME_CMD =
  'chrome.exe --kiosk http://127.0.0.1:3000 --kiosk-printing --disable-extensions --no-first-run';

function CopyBlock({ label, text }: { label: string; text: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    } catch {
      /* ignore */
    }
  };
  return (
    <div className="rounded-xl border border-white/10 bg-navy-950/60 p-3">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-400">{label}</span>
        <button
          type="button"
          onClick={copy}
          className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-0.5 text-[11px] text-gold-300 transition hover:bg-white/10"
        >
          {done ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {done ? "הועתק" : "העתק"}
        </button>
      </div>
      <code className="block break-all text-left font-mono text-[11px] leading-relaxed text-slate-200" dir="ltr">
        {text}
      </code>
    </div>
  );
}

export function SetupTab({ onShutdown }: { onShutdown: () => void }) {
  return (
    <div className="space-y-4">
      <SectionCard
        title="הפעלה בעמדת קיוסק (Safer Kiosk)"
        icon={<Monitor className="h-4 w-4 text-gold-400" />}
        hint="איך להריץ את העמדה במסך מלא, עם הדפסה ישירה, בתוכנת נעילה כמו סייפר."
      >
        <ol className="list-decimal space-y-2 pe-5 text-xs leading-relaxed text-slate-300">
          <li>
            הפעל את הדפדפן במצב אפליקציה עם הדגל <code className="rounded bg-white/10 px-1 font-mono">--kiosk-printing</code>.
            הוא שולח הדפסה ישירות למדפסת ברירת המחדל, בלי חלון אישור.
          </li>
          <li>בהגדרות תוכנת הנעילה, הוסף את קובץ ההפעלה של הדפדפן לרשימת התוכנות המותרות.</li>
          <li>אפשר גם את המדפסת ואת כוננים נשלפים (דיסק און קי), אחרת ההעתקה תיחסם.</li>
          <li>הגדר את התוכנה לעלות אוטומטית בכניסה למחשב, וכוון אותה לכתובת העמדה.</li>
        </ol>
        <div className="mt-4 space-y-2.5">
          <CopyBlock label="Microsoft Edge (מומלץ)" text={EDGE_CMD} />
          <CopyBlock label="Google Chrome" text={CHROME_CMD} />
        </div>
      </SectionCard>

      <SectionCard
        title="גישה מהירה להגדרות"
        icon={<ShieldAlert className="h-4 w-4 text-gold-400" />}
      >
        <p className="text-xs leading-relaxed text-slate-300">
          לפתיחת הניהול נגעו בפינה השמאלית העליונה של המסך (אזור בלתי נראה), או הקישו{" "}
          <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px]">Ctrl</kbd> +{" "}
          <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px]">Alt</kbd> +{" "}
          <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px]">A</kbd>. נדרש קוד מנהל.
        </p>
      </SectionCard>

      <div className="rounded-2xl border border-red-400/30 bg-red-500/[0.07] p-4">
        <h4 className="mb-1 flex items-center gap-2 text-sm font-bold text-red-100">
          <Power className="h-4 w-4" />
          יציאה וכיבוי העמדה
        </h4>
        <p className="mb-3 text-xs text-slate-300">
          היציאה מהתוכנה זמינה רק מכאן (לא מוצגת למשתמשים בעמדה). תוצג בקשת אישור לפני הכיבוי.
        </p>
        <FxButton variant="danger" onClick={onShutdown} className="h-11 px-5 text-sm">
          <Power className="h-4 w-4" />
          כיבוי העמדה
        </FxButton>
      </div>
    </div>
  );
}
