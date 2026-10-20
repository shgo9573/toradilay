import { checkAdmin } from "@/lib/server/guard";
import { clearDriveCaches } from "@/lib/server/drive";
import { buildGoogleAuthStatus } from "@/lib/server/google-oauth";
import { saveGoogleAccount } from "@/lib/server/settings";
import { loadServiceAccount } from "@/lib/server/sheets";

export const dynamic = "force-dynamic";

const REQUIRED_SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/spreadsheets",
];

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { pin?: string; accessToken?: string };
    const check = await checkAdmin(body.pin);
    if (!check.ok) {
      return Response.json({ ok: false, error: check.error }, { status: check.status });
    }

    const accessToken = String(body.accessToken ?? "").trim();
    if (!accessToken || accessToken.length > 8192) {
      return Response.json({ ok: false, error: "לא התקבל אסימון Google תקין." }, { status: 400 });
    }

    const tokenInfoUrl = new URL("https://oauth2.googleapis.com/tokeninfo");
    tokenInfoUrl.searchParams.set("access_token", accessToken);
    const tokenInfoRes = await fetch(tokenInfoUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    const tokenInfo = (await tokenInfoRes.json().catch(() => ({}))) as {
      scope?: string;
      expires_in?: number | string;
    };
    if (!tokenInfoRes.ok || !tokenInfo.scope) {
      return Response.json(
        { ok: false, error: "Google דחתה את ההרשאה. התחבר מחדש דרך החלון שנפתח." },
        { status: 401 },
      );
    }

    const grantedScopes = tokenInfo.scope.split(/\s+/).filter(Boolean);
    const missingScopes = REQUIRED_SCOPES.filter((scope) => !grantedScopes.includes(scope));
    if (missingScopes.length) {
      return Response.json(
        { ok: false, error: "לא אושרו כל ההרשאות הנדרשות. התחבר שוב ואשר גישה ל-Drive ול-Sheets." },
        { status: 403 },
      );
    }

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    const profile = (await profileRes.json().catch(() => ({}))) as {
      email?: string; name?: string; picture?: string;
    };
    if (!profileRes.ok || !profile.email) {
      return Response.json(
        { ok: false, error: "לא ניתן לאמת את חשבון Google. נסה להתחבר מחדש." },
        { status: 401 },
      );
    }

    const expiresIn = Math.max(60, Math.min(3600, Number(tokenInfo.expires_in) || 3600));
    await saveGoogleAccount({
      email: profile.email.trim(),
      name: profile.name?.trim() || undefined,
      picture: profile.picture?.trim() || undefined,
      refreshToken: "",
      accessToken,
      expiresAt: Date.now() + expiresIn * 1000,
      scope: grantedScopes.join(" "),
      connectedAt: new Date().toISOString(),
    });
    clearDriveCaches();

    const serviceAccount = loadServiceAccount();
    return Response.json({
      ok: true,
      status: await buildGoogleAuthStatus(serviceAccount?.client_email ?? null),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "שמירת חיבור Google נכשלה";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
