"use client";

import { AnimatePresence, motion } from "motion/react";
import { Loader2, Power, RotateCcw } from "lucide-react";
import { useFx } from "@/lib/client/fx";
import { FxButton } from "./FxButton";

export function ExitModal({
  open,
  isShuttingDown,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  isShuttingDown: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { on } = useFx();
  const anim = on("pageTransitions");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="exit"
          className="fixed inset-0 z-[70] flex select-none items-center justify-center bg-navy-950/85 p-4 backdrop-blur-sm"
          initial={anim ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          exit={anim ? { opacity: 0 } : { opacity: 0, transition: { duration: 0 } }}
        >
          <motion.div
            className="panel-solid w-full max-w-md space-y-5 border-red-400/40 p-6 shadow-2xl"
            initial={anim ? { opacity: 0, scale: 0.9, y: 20 } : false}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={anim ? { opacity: 0, scale: 0.95 } : { opacity: 0, transition: { duration: 0 } }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-red-400/30 bg-red-500/15">
                <Power className="h-7 w-7 text-red-300" />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-white">יציאה וכיבוי מלא של המערכת</h3>
                <p className="text-xs text-slate-400">סגירת התוכנה וסיום כל הפעילות בעמדה</p>
              </div>
            </div>

            <div className="space-y-1.5 rounded-xl border border-red-400/25 bg-red-500/10 p-3.5 text-sm leading-relaxed">
              <p className="font-bold text-red-100">האם אתה בטוח שברצונך לצאת מהתוכנה?</p>
              <p className="text-xs text-slate-300">
                העמדה תיסגר ותפסיק לשרת עד להפעלה הבאה. פעולה זו מיועדת לצוות בלבד.
              </p>
            </div>

            {isShuttingDown ? (
              <div className="flex items-center justify-center gap-3 py-3 font-bold text-red-200">
                <Loader2 className="keep-anim h-5 w-5 animate-spin" />
                <span>מכבה את העמדה...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <FxButton variant="ghost" onClick={onCancel} className="h-12 text-sm">
                  <RotateCcw className="h-4 w-4" />
                  ביטול, חזרה לעמדה
                </FxButton>
                <FxButton variant="danger" onClick={onConfirm} className="h-12 text-sm">
                  <Power className="h-4 w-4" />
                  כן, צא וכבה
                </FxButton>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
