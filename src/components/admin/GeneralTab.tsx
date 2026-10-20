"use client";

import { KeyRound, Maximize, Palette, Timer } from "lucide-react";
import type { KioskConfig } from "@/lib/types";
import { Field, SectionCard, ToggleRow, inputClass } from "./ui";

const TIMEOUTS = [30, 60, 90, 120, 180, 300];

export function GeneralTab({
  draft,
  update,
  newPin,
  setNewPin,
}: {
  draft: KioskConfig;
  update: (patch: Partial<KioskConfig>) => void;
  newPin: string;
  setNewPin: (v: string) => void;
}) {
  const pinInvalid = newPin.length > 0 && !/^\d{4,12}$/.test(newPin);

  return (
    <div className="space-y-4">
      <SectionCard
        title="מיתוג העמדה"
        icon={<Palette className="h-4 w-4 text-gold-400" />}
        hint="הטקסטים שמוצגים בכותרת ובמסך הפתיחה."
      >
        <div className="grid gap-3.5 md:grid-cols-2">
          <Field label="שם העמדה">
            <input
              type="text"
              value={draft.kioskTitle}
              maxLength={40}
              onChange={(e) => update({ kioskTitle: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="כותרת משנה">
            <input
              type="text"
              value={draft.kioskSubtitle}
              maxLength={80}
              onChange={(e) => update({ kioskSubtitle: e.target.value })}
              className={inputClass}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="זמן איפוס אוטומטי"
        icon={<Timer className="h-4 w-4 text-gold-400" />}
        hint="חזרה למסך ההקלדה לאחר חוסר פעילות, כדי להגן על פרטיות התלמידים."
      >
        <div className="flex flex-wrap gap-2">
          {TIMEOUTS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => update({ autoLogoutSeconds: s })}
              className={`h-11 min-w-[5.5rem] cursor-pointer rounded-xl border px-3 text-sm font-bold transition ${
                draft.autoLogoutSeconds === s
                  ? "border-gold-300/70 bg-gradient-to-b from-gold-400 to-gold-600 text-navy-900"
                  : "border-white/15 bg-white/[0.05] text-slate-200 hover:bg-white/10"
              }`}
            >
              {s >= 60 ? `${s / 60 === Math.floor(s / 60) ? s / 60 : (s / 60).toFixed(1)} דק׳` : `${s} שנ׳`}
            </button>
          ))}
        </div>
      </SectionCard>

      <ToggleRow
        title="נעילת מסך מלא"
        description="מעבר אוטומטי למסך מלא בנגיעה הראשונה וחסימת תפריט לחיצה ימנית. מתאים לעמדות ציבוריות."
        checked={draft.kioskLockFullscreen}
        onChange={(v) => update({ kioskLockFullscreen: v })}
      >
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
          <Maximize className="h-3.5 w-3.5" />
          כדי לצאת ממסך מלא לחץ Esc
        </div>
      </ToggleRow>

      <SectionCard
        title="קוד מנהל"
        icon={<KeyRound className="h-4 w-4 text-gold-400" />}
        hint="להחלפת הקוד הזן קוד חדש (4–12 ספרות). השאר ריק כדי לא לשנות."
      >
        <input
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          value={newPin}
          maxLength={12}
          onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
          placeholder="קוד חדש"
          className={`${inputClass} max-w-xs text-center font-mono tracking-[0.4em] ${pinInvalid ? "!border-red-400" : ""}`}
        />
        {pinInvalid && <p className="mt-1.5 text-xs text-red-300">הקוד חייב להכיל בין 4 ל-12 ספרות</p>}
      </SectionCard>
    </div>
  );
}
