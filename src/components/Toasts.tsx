"use client";

import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, CheckCircle2, FolderDown, Info, Printer, X } from "lucide-react";
import { useFx } from "@/lib/client/fx";

export interface ToastItem {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  message?: string;
  actionType?: "print" | "copy";
}

const STYLES = {
  success: { ring: "border-emerald-400/40", bar: "bg-emerald-400", icon: "bg-emerald-400/15 text-emerald-300" },
  error: { ring: "border-red-400/40", bar: "bg-red-400", icon: "bg-red-400/15 text-red-300" },
  info: { ring: "border-sky-400/40", bar: "bg-sky-400", icon: "bg-sky-400/15 text-sky-300" },
} as const;

export function Toasts({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  const { on } = useFx();
  const anim = on("pageTransitions");

  return (
    <div className="pointer-events-none fixed bottom-14 left-5 z-[60] flex w-full max-w-sm flex-col gap-3">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const s = STYLES[t.type];
          const Icon =
            t.actionType === "print"
              ? Printer
              : t.actionType === "copy"
                ? FolderDown
                : t.type === "success"
                  ? CheckCircle2
                  : t.type === "error"
                    ? AlertCircle
                    : Info;
          return (
            <motion.div
              key={t.id}
              layout={anim}
              initial={anim ? { opacity: 0, x: -60, scale: 0.92 } : false}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={anim ? { opacity: 0, x: -60, scale: 0.92 } : { opacity: 0, transition: { duration: 0 } }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              className={`panel pointer-events-auto overflow-hidden !rounded-2xl border ${s.ring} shadow-2xl`}
            >
              <div className="flex items-start gap-3 p-4">
                <div className={`mt-0.5 shrink-0 rounded-xl p-2 ${s.icon}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold leading-tight text-white">{t.title}</h4>
                  {t.message && (
                    <p className="mt-1 break-words text-xs font-medium leading-normal text-slate-300">
                      {t.message}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onDismiss(t.id)}
                  className="shrink-0 cursor-pointer rounded-lg p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
                  aria-label="סגירה"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="h-[3px] w-full bg-white/5">
                <div className={`toast-progress h-full w-full ${s.bar}`} />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
