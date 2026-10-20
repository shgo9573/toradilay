"use client";

import { useState } from "react";
import { CheckCircle2, ExternalLink, FolderOpen, Loader2, Lock, PlugZap, XCircle } from "lucide-react";
import type { GoogleAuthStatus, KioskConfig } from "@/lib/types";
import { testDriveFolder } from "@/lib/client/api";
import { FxButton } from "../FxButton";
import { GoogleAccountCard } from "./GoogleAccountCard";
import { Field, SectionCard, inputClass } from "./ui";

type TestResult = Awaited<ReturnType<typeof testDriveFolder>>;

const AUTH_MODE_LABEL: Record<string, string> = {
  oauth: "חשבון Google מחובר (API רשמי — תומך בתיקיות פרטיות)",
  "service-account": "חשבון שירות (Service Account)",
  public: "גישה ציבורית (ללא התחברות)",
};

export function GoogleTab({
  draft,
  update,
  pin,
  onGoogleStatusChange,
}: {
  draft: KioskConfig;
  update: (patch: Partial<KioskConfig>) => void;
  pin: string;
  onGoogleStatusChange?: (status: GoogleAuthStatus | null) => void;
}) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const runTest = async () => {
    setTesting(true);
    setResult(null);
    const r = await testDriveFolder(pin, draft.rootFolderId.trim());
    setResult(r);
    setTesting(false);
  };

  // מאפשר להדביק קישור מלא של תיקייה ולחלץ ממנו את המזהה
  const handleIdChange = (raw: string) => {
    const m = raw.match(/folders\/([A-Za-z0-9_-]{10,})/);
    update({ rootFolderId: m ? m[1] : raw.trim() });
    setResult(null);
  };

  return (
    <div className="space-y-4">
      <GoogleAccountCard pin={pin} onStatusChange={onGoogleStatusChange} />

      <SectionCard
        title="תיקיית השורש בגוגל דרייב"
        icon={<FolderOpen className="h-4 w-4 text-gold-400" />}
        hint="המערכת קוראת את התיקייה הראשית ומחפשת בה תיקייה ששמה הוא מספר תעודת הזהות (פועל גם כשהתיקייה פרטית אם חובר חשבון Google למעלה)."
      >
        <div className="space-y-3.5">
          <Field label="מזהה התיקייה (או הדבקה של קישור מלא)">
            <input
              type="text"
              dir="ltr"
              value={draft.rootFolderId}
              onChange={(e) => handleIdChange(e.target.value)}
              placeholder="1CXFm0VyVtSZIqONXJYMmIu0hJyxUqj2B"
              className={`${inputClass} font-mono text-left`}
            />
          </Field>
          <Field label="שם תצוגה לתיקייה">
            <input
              type="text"
              value={draft.rootFolderName}
              onChange={(e) => update({ rootFolderName: e.target.value })}
              className={inputClass}
            />
          </Field>

          <div className="flex flex-wrap items-center gap-3">
            <FxButton variant="navy" onClick={runTest} disabled={testing || !draft.rootFolderId} className="h-11 px-5 text-sm">
              {testing ? <Loader2 className="keep-anim h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />}
              בדיקת חיבור לדרייב
            </FxButton>
            <a
              href={`https://drive.google.com/drive/folders/${draft.rootFolderId}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-sky-300 hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              פתח בדרייב
            </a>
          </div>

          {result && (
            <div
              className={`rounded-xl border p-3.5 text-sm ${
                result.ok
                  ? "border-emerald-400/35 bg-emerald-400/[0.08] text-emerald-100"
                  : "border-red-400/35 bg-red-400/[0.08] text-red-100"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2 font-bold">
                {result.ok ? <CheckCircle2 className="h-5 w-5 text-emerald-300" /> : <XCircle className="h-5 w-5 text-red-300" />}
                {result.ok ? "החיבור לדרייב תקין" : "החיבור לדרייב נכשל"}
                {result.ms !== undefined && (
                  <span className="font-mono text-xs font-normal opacity-70">({result.ms}ms)</span>
                )}
              </div>
              {result.ok ? (
                <div className="mt-2 space-y-1.5 text-xs">
                  {result.authMode && (
                    <div className="flex items-center gap-1.5 text-emerald-200/90">
                      <Lock className="h-3.5 w-3.5" />
                      מצב חיבור: <strong>{AUTH_MODE_LABEL[result.authMode] ?? result.authMode}</strong>
                    </div>
                  )}
                  <div>
                    נמצאו <strong>{result.folderCount}</strong> תיקיות תלמידים ו-<strong>{result.fileCount}</strong> קבצים בשורש.
                  </div>
                  {result.sample && result.sample.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {result.sample.map((n) => (
                        <span key={n} className="rounded-md bg-white/10 px-2 py-0.5 font-mono" dir="ltr">
                          {n}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-1.5 text-xs leading-relaxed">{result.error}</p>
              )}
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard title="איך עובדת הגישה לדרייב?">
        <ul className="list-disc space-y-1.5 pe-5 text-xs leading-relaxed text-slate-300">
          <li>
            <strong>עם חשבון Google מחובר:</strong> עובד מול Google Drive API הרשמי — תומך בתיקיות{" "}
            <strong>פרטיות לחלוטין</strong>, בתיקיות ששותפו איתך, וללא הגבלת כמות תלמידים.
          </li>
          <li>
            <strong>ללא חשבון מחובר:</strong> עובד אם התיקייה משותפת כ&quot;כל מי שיש לו את הקישור – צפייה&quot;.
          </li>
          <li>בתוך תיקיית התלמיד מוצגים קבצי Word (‎.docx / .doc / Google Docs). אם אין אינטרנט, המערכת מחפשת גיבוי בכונן המקומי.</li>
        </ul>
      </SectionCard>
    </div>
  );
}
