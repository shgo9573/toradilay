import { checkAdmin } from "@/lib/server/guard";
import { clearDriveCaches } from "@/lib/server/drive";
import {
  buildGoogleAuthStatus,
  completeGoogleOAuthFlow,
  parseAuthorizationInput,
} from "@/lib/server/google-oauth";
import { loadServiceAccount } from "@/lib/server/sheets";

export const dynamic = "force-dynamic";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderPopupResultPage(opts: {
  ok: boolean;
  email?: string;
  error?: string;
}): Response {
  const payload = JSON.stringify({
    type: "kiosk:google-oauth",
    ok: opts.ok,
    email: opts.email ?? null,
    error: opts.error ?? null,
    ts: Date.now(),
  });

  const html = `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${opts.ok ? "החיבור ל-Google הושלם" : "שגיאה בחיבור ל-Google"}</title>
<style>
  * { box-sizing: border-box; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
  body {
    margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: radial-gradient(circle at top right, #1e3567, #050b1a 70%);
    color: #f8fafc; padding: 24px; text-align: center;
  }
  .card {
    max-width: 440px; width: 100%; background: rgba(13, 26, 53, 0.92);
    border: 1px solid ${opts.ok ? "rgba(52,211,153,0.45)" : "rgba(248,113,113,0.45)"};
    border-radius: 24px; padding: 32px 28px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.65);
  }
  .badge {
    width: 64px; height: 64px; border-radius: 999px; margin: 0 auto 16px;
    display: flex; align-items: center; justify-content: center; font-size: 28px;
    background: ${opts.ok ? "rgba(16,185,129,0.18)" : "rgba(239,68,68,0.18)"};
    color: ${opts.ok ? "#6ee7b7" : "#fca5a5"};
  }
  h1 { margin: 0 0 8px; font-size: 22px; }
  p { margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #cbd5e1; word-break: break-word; }
  .email { font-family: monospace; color: #fbeeb8; font-weight: 700; direction: ltr; display: inline-block; }
  button {
    cursor: pointer; border: 0; border-radius: 12px; padding: 12px 28px;
    font-weight: 700; font-size: 14px;
    background: linear-gradient(135deg, #fbeeb8, #e5be53, #c59b27); color: #1a1203;
  }
</style>
</head>
<body>
  <div class="card">
    <div class="badge">${opts.ok ? "✓" : "!"}</div>
    <h1>${opts.ok ? "החשבון חובר ונשמר לצמיתות!" : "החיבור ל-Google לא הושלם"}</h1>
    <p>${
      opts.ok
        ? `מחובר כעת לחשבון <span class="email">${escapeHtml(opts.email || "")}</span>.<br/>הגישה ל-Google Drive (כולל פרטי) ול-Google Sheets נשמרה בהגדרות.`
        : escapeHtml(opts.error || "אירעה שגיאה")
    }</p>
    <button type="button" onclick="window.close()">סגור חלון</button>
  </div>
  <script>
    (function () {
      var data = ${payload};
      try { new BroadcastChannel("kiosk-google-oauth").postMessage(data); } catch (e) {}
      try { localStorage.setItem("kiosk_google_oauth_event", JSON.stringify(data)); } catch (e) {}
      try { if (window.opener) window.opener.postMessage(data, "*"); } catch (e) {}
      ${opts.ok ? "setTimeout(function () { try { window.close(); } catch (e) {} }, 900);" : ""}
    })();
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

/** Callback אוטומטי מ-Google בסיום ההתחברות בחלון הקופץ */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const oauthError = url.searchParams.get("error");
  if (oauthError) {
    const desc =
      oauthError === "access_denied"
        ? "הגישה נדחתה (access_denied). אם הפרויקט ב-Google Cloud במצב Testing — הוסף את המייל לרשימת Test Users או לחץ על Publish App."
        : `Google החזירה שגיאה: ${oauthError}`;
    return renderPopupResultPage({ ok: false, error: desc });
  }

  const code = url.searchParams.get("code")?.trim() || "";
  const state = url.searchParams.get("state")?.trim() || "";
  if (!code || !state) {
    return renderPopupResultPage({ ok: false, error: "חסר קוד אישור מ-Google." });
  }

  try {
    const account = await completeGoogleOAuthFlow({
      code,
      state,
      requireValidState: true,
    });
    clearDriveCaches();
    return renderPopupResultPage({ ok: true, email: account.email });
  } catch (err) {
    const message = err instanceof Error ? err.message : "החיבור ל-Google נכשל";
    return renderPopupResultPage({ ok: false, error: message });
  }
}

/** השלמת חיבור ידנית ע"י המנהל (כשהדביק כתובת callback עם code מלקוח Desktop App) */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      pin?: string;
      callbackUrlOrCode?: string;
      origin?: string;
    };
    const check = await checkAdmin(body.pin);
    if (!check.ok) {
      return Response.json({ ok: false, error: check.error }, { status: check.status });
    }

    const parsed = parseAuthorizationInput(String(body.callbackUrlOrCode ?? ""));
    if (parsed.oauthError) {
      return Response.json(
        { ok: false, error: `Google החזירה שגיאה: ${parsed.oauthError}` },
        { status: 400 },
      );
    }
    if (!parsed.code) {
      return Response.json(
        { ok: false, error: "לא נמצא קוד אישור (code) בקישור שהודבק." },
        { status: 400 },
      );
    }

    await completeGoogleOAuthFlow({
      code: parsed.code,
      state: parsed.state,
      requireValidState: false,
      originFallback: body.origin,
      redirectUriHint: parsed.redirectUri,
    });
    clearDriveCaches();

    const sa = loadServiceAccount();
    return Response.json({
      ok: true,
      status: await buildGoogleAuthStatus(sa?.client_email ?? null),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "השלמת החיבור נכשלה";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
