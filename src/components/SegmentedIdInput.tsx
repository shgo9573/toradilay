"use client";

import { Fragment } from "react";
import { Loader2 } from "lucide-react";

const GROUPS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
];

/** תצוגת 9 ספרות בשלוש קבוצות. ההקלדה מתבצעת במקלדת המגע או במקלדת פיזית */
export function SegmentedIdInput({
  value,
  isLoading,
  maxLength = 9,
}: {
  value: string;
  isLoading: boolean;
  maxLength?: number;
}) {
  const activeIndex = value.length < maxLength ? value.length : -1;

  return (
    <div className="relative w-full select-none" dir="ltr" aria-hidden="true">
      <div className="flex w-full items-center justify-between gap-2">
        {GROUPS.map((group, gi) => (
          <Fragment key={gi}>
            <div className="inset-field flex min-w-0 flex-1 items-center gap-1.5 rounded-2xl p-1.5">
              {group.map((idx) => {
                const digit = value[idx] ?? "";
                const filled = digit !== "";
                const active = idx === activeIndex && !isLoading;
                return (
                  <div
                    key={idx}
                    className={`digit-slot flex h-[clamp(46px,7vh,62px)] min-w-0 flex-1 items-center justify-center rounded-xl border ${
                      active
                        ? "is-active"
                        : filled
                          ? "is-filled border-white/25 bg-white/[0.12]"
                          : "border-white/10 bg-white/[0.04]"
                    }`}
                  >
                    {filled ? (
                      <span
                        key={digit + idx}
                        className="digit-pop font-mono text-2xl font-black leading-none text-white"
                      >
                        {digit}
                      </span>
                    ) : active ? (
                      <span className="caret h-6 w-0.5 rounded-full bg-gold-400" />
                    ) : (
                      <span className="text-sm font-bold text-white/20">·</span>
                    )}
                  </div>
                );
              })}
            </div>
            {gi < GROUPS.length - 1 && (
              <span className="h-1 w-2.5 shrink-0 rounded-full bg-white/20" />
            )}
          </Fragment>
        ))}
      </div>

      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center gap-3 rounded-2xl bg-navy-950/80 backdrop-blur-[2px]" dir="rtl">
          <Loader2 className="keep-anim h-5 w-5 animate-spin text-gold-400" />
          <span className="text-sm font-bold text-gold-200">מחפש תיקייה...</span>
        </div>
      )}
    </div>
  );
}
