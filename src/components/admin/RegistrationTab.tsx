"use client";

import { useEffect, useState } from "react";
import {
  Check,
  CheckCircle2,
  Code2,
  Copy,
  ExternalLink,
  FileSpreadsheet,
  KeyRound,
  Loader2,
  PlugZap,
  UserCheck,
  XCircle,
} from "lucide-react";
import { DEFAULT_SPREADSHEET_ID, extractGoogleId } from "@/lib/defaults";
import type { KioskConfig, RegistrationStatus } from "@/lib/types";
import { fetchRegistrationStatus, testSheetsConnection } from "@/lib/client/api";
import { FxButton } from "../FxButton";
import { Field, SectionCard, ToggleRow, inputClass } from "./ui";

type TestResult = Awaited<ReturnType<typeof testSheetsConnection>>;

const METHOD_LABEL: Record<string, string> = {
  oauth: "חשבון Google מחובר (קבוע)",
  "service-account": "חשבון שירות (Service Account)",
  webhook: "Apps Script",
};

export const APPS_SCRIPT_SNIPPET = `function doPost(e) {
  var body = JSON.parse((e.postData && e.postData.contents) || "{}");
  var ss = body.spreadsheetId
    ? SpreadsheetApp.openById(body.spreadsheetId)
    : SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0];

  if (body.action === "info") {
    return out({
      title: ss.getName(),
      sheets: ss.getSheets().map(function (s) { return s.getName(); }),
      rowCount: Math.max(0, sheet.getLastRow() - 1)
    });
  }

  if (body.action === "check") {
    var values = sheet.getDataRange().getValues();
    for (var i = 0; i < values.length; i++) {
      if (String(values[i][2]).trim() === String(body.idNumber)) {
        return out({ exists: true, rowNumber: i + 1,
          studentName: (String(values[i][0]) + " " + String(values[i][1])).trim() });
      }
    }
    return out({ exists: false });
  }

  if (body.action === "register") {
    if (sheet.getLastRow() === 0 && body.headers) sheet.appendRow(body.headers);
    sheet.appendRow([body.firstName, body.lastName, body.idNumber, Number(body.vaad), body.timestamp]);
    return out({ success: true, updatedRange: sheet.getName() + "!A" + sheet.getLastRow() });
  }

  return out({ error: "unknown action" });
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}`;

function CopyButton({ text, label = "העתק" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1800);
        } catch {
          /* ignore */
        }
      }}
      className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold text-gold-300 transition hover:bg-white/10"
    >
      {done ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {done ? "הועתק" : label}
    </button>
  );
}

export function RegistrationTab({
  draft,
  update,
  pin,
  webhookUrl,
  setWebhookUrl,
  googleAccountEmail,
  onOpenGoogleTab,
}: {
  draft: KioskConfig;
  update: (patch: Partial<KioskConfig>) => void;
  pin: string;
  webhookUrl: string;
  setWebhookUrl: (v: string) => void;
  googleAccountEmail?: string | null;
  onOpenGoogleTab: () => void;
}) {
  const [status, setStatus] = useState<RegistrationStatus | null>(null);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [showScript, setShowScript] = useState(false);

  useEffect(() => {
    fetchRegistrationStatus(pin).then(setStatus);
  }, [pin, googleAccountEmail]);

  const connectedEmail = googleAccountEmail ?? status?.googleAccountEmail ?? null;
  const hasOAuth = Boolean(connectedEmail) || status?.method === "oauth";
  const hasServiceAccount = Boolean(status?.serviceAccountEmail);
  const effectiveMethod = hasOAuth
    ? "oauth"
    : hasServiceAccount
      ? "service-account"
      : webhookUrl.trim()
        ? "webhook"
        : null;

  const runTest = async () => {
    setTesting(true);
    setResult(null);
    const r = await testSheetsConnection(pin, draft.spreadsheetId, webhookUrl.trim());
    setResult(r);
    setTesting(false);
  };

  return (
    <div className="space-y-4">
      <ToggleRow
        title="אפשר רישום תלמידים מהעמדה"
        description='מציג כפתור "רישום תלמיד" בכותרת ובמסך ההקלדה. הרישום נכתב כשורה חדשה בגיליון Google Sheets.'
        checked={draft.registrationEnabled}
        onChange={(v) => update({ registrationEnabled: v })}
      />

      <SectionCard
        title="גיליון רישום תלמידים (Google Sheets)"
        icon={<FileSpreadsheet className="h-4 w-4 text-emerald-400" />}
        hint="כל רישום מוסיף שורה: A=שם פרטי, B=שם משפחה, C=תעודת זהות, D=ועד, E=תאריך ושעה."
        action={
          <span
            className={`shrink-0 whitespace-nowrap rounded-md px-2.5 py-1 text-[10px] font-bold ${
              effectiveMethod
                ? "bg-emerald-400/15 text-emerald-200"
                : "bg-amber-400/15 text-amber-200"
            }`}
          >
            {effectiveMethod ? "פעיל" : "לא מחובר"}
          </span>
        }
      >
        <div className="space-y-3.5">
          <Field label="מזהה הגיליון (או הדבקה של קישור מלא)">
            <input
              type="text"
              dir="ltr"
              value={draft.spreadsheetId}
              onChange={(e) => {
                update({ spreadsheetId: extractGoogleId(e.target.value) });
                setResult(null);
              }}
              placeholder={DEFAULT_SPREADSHEET_ID}
              className={`${inputClass} font-mono text-left`}
            />
          </Field>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <button
              type="button"
              onClick={() => update({ spreadsheetId: DEFAULT_SPREADSHEET_ID })}
              className="cursor-pointer text-slate-400 underline-offset-2 hover:text-white hover:underline"
            >
              שחזר למזהה ברירת המחדל
            </button>
            <a
              href={`https://docs.google.com/spreadsheets/d/${draft.spreadsheetId || DEFAULT_SPREADSHEET_ID}/edit`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-sky-300 hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              צפה בגיליון ב-Google Sheets
            </a>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="חיבור לכתיבה בגיליון"
        icon={<KeyRound className="h-4 w-4 text-gold-400" />}
        hint="השרת כותב לגיליון בעצמו ללא צורך בהתחברות של תלמידים בעמדה."
      >
        <div className="space-y-4">
          {/* דרך 1: חשבון Google מחובר (הדרך הראשית והמומלצת) */}
          <div
            className={`rounded-xl border p-3.5 ${
              hasOAuth
                ? "border-emerald-400/40 bg-emerald-400/[0.08]"
                : "border-gold-400/30 bg-gold-400/[0.05]"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <UserCheck className="h-4 w-4 text-emerald-300" />
                  <span>דרך 1: חשבון Google מחובר קבוע (מומלץ — גם ל-Sheets וגם לדרייב פרטי)</span>
                </div>
                {hasOAuth ? (
                  <p className="mt-1 text-xs text-emerald-100/90">
                    מחובר קבוע לחשבון{" "}
                    <code className="font-mono font-bold text-emerald-200" dir="ltr">
                      {connectedEmail || "Google"}
                    </code>{" "}
                    — כותב ישירות ל-Google Sheets דרך ה-API הרשמי.
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-slate-300">
                    התחבר פעם אחת עם חשבון Google שלך והחיבור יישמר לצמיתות בהגדרות (לכתיבה לגיליון ולגישה לדרייב פרטי).
                  </p>
                )}
              </div>

              <FxButton
                variant={hasOAuth ? "ghost" : "gold"}
                onClick={onOpenGoogleTab}
                className="h-9 shrink-0 px-3.5 text-xs"
              >
                {hasOAuth ? "נהל חשבון" : "חבר חשבון Google"}
              </FxButton>
            </div>
          </div>

          {/* דרך 2: חשבון שירות */}
          <div
            className={`rounded-xl border p-3.5 ${
              effectiveMethod === "service-account"
                ? "border-emerald-400/35 bg-emerald-400/[0.07]"
                : "border-white/10 bg-white/[0.03]"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-bold text-white">דרך 2: חשבון שירות של Google (משתני סביבה)</div>
              {hasServiceAccount ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  מוגדר
                </span>
              ) : (
                <span className="text-[11px] text-slate-500">לא מוגדר</span>
              )}
            </div>
            {hasServiceAccount ? (
              <div className="mt-2 space-y-1.5 text-xs text-slate-300">
                <div className="flex flex-wrap items-center gap-2">
                  <span>שתף את הגיליון כעורך עם:</span>
                  <code className="rounded bg-navy-950/70 px-2 py-0.5 font-mono text-emerald-200" dir="ltr">
                    {status?.serviceAccountEmail}
                  </code>
                  <CopyButton text={status?.serviceAccountEmail ?? ""} />
                </div>
              </div>
            ) : (
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                חלופה לשרתים: הגדר את משתנה הסביבה{" "}
                <code className="rounded bg-navy-950/70 px-1.5 py-0.5 font-mono text-slate-200" dir="ltr">
                  GOOGLE_SERVICE_ACCOUNT_JSON
                </code>{" "}
                ושתף את הגיליון עם כתובת חשבון השירות כעורך.
              </p>
            )}
          </div>

          {/* דרך 3: Apps Script */}
          <div
            className={`rounded-xl border p-3.5 ${
              effectiveMethod === "webhook"
                ? "border-emerald-400/35 bg-emerald-400/[0.07]"
                : "border-white/10 bg-white/[0.03]"
            }`}
          >
            <div className="text-sm font-bold text-white">
              דרך 3: Google Apps Script (ללא מפתחות OAuth)
            </div>
            <ol className="mt-2 list-decimal space-y-1 pe-5 text-xs leading-relaxed text-slate-300">
              <li>פתח את הגיליון ← תפריט <strong>תוספים ← Apps Script</strong>.</li>
              <li>מחק את התוכן, הדבק את הקוד שלמטה ושמור.</li>
              <li>
                <strong>פריסה ← פריסה חדשה ← אפליקציית אינטרנט</strong>: הרצה בתור &quot;אני&quot;, גישה
                ל-<strong>&quot;כל אחד&quot;</strong> (Anyone).
              </li>
              <li>העתק את כתובת ה-Web App והדבק כאן.</li>
            </ol>
            <div className="mt-3">
              <Field label="כתובת ה-Web App של Apps Script">
                <input
                  type="url"
                  dir="ltr"
                  value={webhookUrl}
                  onChange={(e) => {
                    setWebhookUrl(e.target.value);
                    setResult(null);
                  }}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className={`${inputClass} font-mono text-left text-xs`}
                />
              </Field>
            </div>
            <button
              type="button"
              onClick={() => setShowScript((v) => !v)}
              className="mt-3 flex cursor-pointer items-center gap-1.5 text-xs font-bold text-gold-300 hover:underline"
            >
              <Code2 className="h-3.5 w-3.5" />
              {showScript ? "הסתר את קוד ה-Apps Script" : "הצג את קוד ה-Apps Script להדבקה"}
            </button>
            {showScript && (
              <div className="mt-2 rounded-xl border border-white/10 bg-navy-950/70">
                <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
                  <span className="text-[11px] font-bold text-slate-400">Code.gs</span>
                  <CopyButton text={APPS_SCRIPT_SNIPPET} label="העתק קוד" />
                </div>
                <pre className="max-h-64 overflow-auto p-3 text-left font-mono text-[11px] leading-relaxed text-slate-200" dir="ltr">
                  {APPS_SCRIPT_SNIPPET}
                </pre>
              </div>
            )}
          </div>

          {/* בדיקה */}
          <div className="flex flex-wrap items-center gap-3">
            <FxButton
              variant="navy"
              onClick={runTest}
              disabled={testing || !draft.spreadsheetId || !effectiveMethod}
              className="h-11 px-5 text-sm"
            >
              {testing ? <Loader2 className="keep-anim h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />}
              בדיקת חיבור לגיליון
            </FxButton>
            {!effectiveMethod && (
              <span className="text-xs text-slate-500">חבר חשבון Google למעלה (או הגדר חלופה) כדי לבדוק</span>
            )}
          </div>

          {result && (
            <div
              className={`rounded-xl border p-3.5 text-sm ${
                result.ok
                  ? "border-emerald-400/35 bg-emerald-400/[0.08] text-emerald-100"
                  : "border-red-400/35 bg-red-400/[0.08] text-red-100"
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {result.ok ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-300" />
                )}
                {result.ok ? "החיבור לגיליון תקין" : "החיבור נכשל"}
                {result.ms !== undefined && (
                  <span className="font-mono text-xs font-normal opacity-70">({result.ms}ms)</span>
                )}
              </div>
              {result.ok ? (
                <div className="mt-2 space-y-1 text-xs">
                  <div>
                    גיליון: <strong>{result.title}</strong> · לשונית ראשונה:{" "}
                    <strong>{result.firstSheetTitle}</strong>
                    {typeof result.rowCount === "number" && (
                      <>
                        {" "}
                        · <strong>{result.rowCount}</strong> תלמידים רשומים
                      </>
                    )}
                  </div>
                  <div className="text-emerald-200/70">
                    שיטת חיבור: {METHOD_LABEL[result.method ?? ""] ?? result.method}
                  </div>
                </div>
              ) : (
                <p className="mt-1.5 text-xs leading-relaxed">{result.error}</p>
              )}
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
