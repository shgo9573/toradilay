"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Loader2, Printer, Usb, X, FileWarning } from "lucide-react";
import type { KioskFile } from "@/lib/types";
import { fetchPreview } from "@/lib/client/api";
import { useFx } from "@/lib/client/fx";
import { FxButton } from "./FxButton";

export function PreviewModal({
  file,
  onClose,
  onPrint,
  onCopy,
  isPrinting,
  isCopying,
}: {
  file: KioskFile | null;
  onClose: () => void;
  onPrint: (f: KioskFile) => void;
  onCopy: (f: KioskFile) => void;
  isPrinting: boolean;
  isCopying: boolean;
}) {
  const { on } = useFx();
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileId = file?.id;

  useEffect(() => {
    if (!fileId) return;
    let cancelled = false;
    /* eslint-disable react-hooks/set-state-in-effect */
    setHtml(null);
    setError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
    fetchPreview(fileId, "full")
      .then((r) => !cancelled && setHtml(r.html))
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [fileId]);

  const anim = on("pageTransitions");

  return (
    <AnimatePresence>
      {file && (
        <motion.div
          key="preview"
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/85 p-4 backdrop-blur-sm"
          initial={anim ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          exit={anim ? { opacity: 0 } : { opacity: 0, transition: { duration: 0 } }}
          onClick={onClose}
        >
          <motion.div
            className="panel-solid flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden shadow-2xl"
            initial={anim ? { opacity: 0, y: 30, scale: 0.96 } : false}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={anim ? { opacity: 0, y: 20, scale: 0.97 } : { opacity: 0, transition: { duration: 0 } }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-3.5">
              <h3 className="min-w-0 flex-1 truncate font-serif text-lg font-bold text-white" title={file.name}>
                {file.name}
              </h3>
              <FxButton variant="ghost" onClick={onClose} className="h-10 w-10 shrink-0 !rounded-xl" aria-label="סגירה">
                <X className="h-5 w-5" />
              </FxButton>
            </div>

            <div className="flex-1 overflow-y-auto bg-navy-950/60 p-4 sm:p-6">
              {html ? (
                <div className="paper docx-content-page doc-full mx-auto max-w-[760px] rounded-lg p-8 sm:p-12" dangerouslySetInnerHTML={{ __html: html }} />
              ) : error ? (
                <div className="flex flex-col items-center gap-3 py-20 text-slate-300">
                  <FileWarning className="h-10 w-10 text-amber-400" />
                  <p className="text-sm">{error}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-24 text-slate-300">
                  <Loader2 className="keep-anim h-9 w-9 animate-spin text-gold-400" />
                  <p className="text-sm font-medium">טוען את המסמך המלא...</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-white/10 p-4">
              <FxButton variant="navy" disabled={isPrinting} onClick={() => onPrint(file)} className="h-12 text-base">
                {isPrinting ? <Loader2 className="keep-anim h-5 w-5 animate-spin" /> : <Printer className="h-5 w-5" />}
                {isPrinting ? "שולח..." : "הדפסה"}
              </FxButton>
              <FxButton variant="emerald" disabled={isCopying} onClick={() => onCopy(file)} className="h-12 text-base">
                {isCopying ? <Loader2 className="keep-anim h-5 w-5 animate-spin" /> : <Usb className="h-5 w-5" />}
                {isCopying ? "מעתיק..." : "העתק לדיסק און קי"}
              </FxButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
