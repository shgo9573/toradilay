import crypto from "node:crypto";
import type {
  GoogleAuthStatus,
  GoogleOAuthClientConfig,
  StoredConfig,
  StoredGoogleAccount,
} from "@/lib/types";
import {
  getStoredConfig,
  saveGoogleAccount,
  updateRefreshedGoogleToken,
} from "./settings";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

function getTokenUrl(): string {
  return process.env.GOOGLE_OAUTH_TOKEN_URL || "https://oauth2.googleapis.com/token";
}

function getUserInfoUrl(): string {
  return (
    process.env.GOOGLE_OAUTH_USERINFO_URL ||
    "https://www.googleapis.com/oauth2/v2/userinfo"
  );
}

export const GOOGLE_OAUTH_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/spreadsheets",
];

interface PendingOAuthState {
  codeVerifier: string;
  redirectUri: string;
  createdAt: number;
}

const g = globalThis as typeof globalThis & {
  __kioskPendingOAuth?: Map<string, PendingOAuthState>;
  __kioskOAuthRefreshPromise?: Promise<{ token: string; email: string }>;
};

const pendingStates: Map<string, PendingOAuthState> = (g.__kioskPendingOAuth ??= new Map());
const STATE_TTL_MS = 20 * 60 * 1000;

function pruneStates() {
  const cutoff = Date.now() - STATE_TTL_MS;
  for (const [k, v] of pendingStates) {
    if (v.createdAt < cutoff) pendingStates.delete(k);
  }
}

function base64url(buf: Buffer): string {
  return buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function maskSecret(secret: string): string | null {
  if (!secret) return null;
  if (secret.length <= 8) return "••••••••";
  return `${secret.slice(0, 4)}••••••••${secret.slice(-4)}`;
}

/**
 * מפרש תוכן של קובץ client_secret_*.json שהורד מ-Google Cloud Console
 * (תומך ב-web, ב-installed / Desktop App, ובמבנה שטוח).
 */
export function parseClientSecretJson(
  rawText: string,
): GoogleOAuthClientConfig | null {
  try {
    const parsed = JSON.parse(rawText.trim()) as Record<string, unknown>;
    const block =
      parsed.web && typeof parsed.web === "object"
        ? { type: "web" as const, data: parsed.web as Record<string, unknown> }
        : parsed.installed && typeof parsed.installed === "object"
          ? { type: "installed" as const, data: parsed.installed as Record<string, unknown> }
          : { type: "web" as const, data: parsed };

    const clientId = String(block.data.client_id ?? block.data.clientId ?? "").trim();
    const clientSecret = String(
      block.data.client_secret ?? block.data.clientSecret ?? "",
    ).trim();
    if (!clientId || !clientSecret) return null;
    return {
      clientId,
      clientSecret,
      clientType: block.type,
    };
  } catch {
    return null;
  }
}

/** מאתר את מפתחות ה-OAuth הפעילים (משתני סביבה קודמים למסד הנתונים) */
export function resolveOAuthClient(stored: StoredConfig): {
  source: "env" | "db" | null;
  client: GoogleOAuthClientConfig | null;
} {
  const envId = process.env.GOOGLE_CLIENT_ID?.trim() || "";
  const envSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() || "";
  if (envId && envSecret) {
    return {
      source: "env",
      client: {
        clientId: envId,
        clientSecret: envSecret,
        clientType: process.env.GOOGLE_CLIENT_TYPE === "installed" ? "installed" : "web",
        redirectUriOverride: process.env.GOOGLE_REDIRECT_URI?.trim() || undefined,
      },
    };
  }
  const dbClient = stored.googleOAuthClient;
  if (dbClient?.clientId && dbClient?.clientSecret) {
    return { source: "db", client: dbClient };
  }
  return { source: dbClient ? "db" : null, client: dbClient ?? null };
}

function isLoopbackHost(origin: string): boolean {
  try {
    const h = new URL(origin).hostname;
    return h === "localhost" || h === "127.0.0.1" || h === "[::1]";
  } catch {
    return false;
  }
}

/** מחשב את כתובת ה-Redirect URI המדויקת עבור בקשת ההתחברות */
export function computeRedirectUri(
  origin: string,
  client: GoogleOAuthClientConfig,
): { redirectUri: string; needsManualCallbackPaste: boolean } {
  if (client.redirectUriOverride?.trim()) {
    return {
      redirectUri: client.redirectUriOverride.trim(),
      needsManualCallbackPaste: false,
    };
  }
  if (process.env.GOOGLE_REDIRECT_URI?.trim()) {
    return {
      redirectUri: process.env.GOOGLE_REDIRECT_URI.trim(),
      needsManualCallbackPaste: false,
    };
  }
  if (client.clientType === "installed" && !isLoopbackHost(origin)) {
    // לקוח מסוג Desktop App בשרת מרוחק: Google מאשרת כתובת loopback ללא צורך ברישום כתובת בענן
    return {
      redirectUri: "http://127.0.0.1/api/google/callback",
      needsManualCallbackPaste: true,
    };
  }
  return {
    redirectUri: `${origin.replace(/\/$/, "")}/api/google/callback`,
    needsManualCallbackPaste: false,
  };
}

/** מתחיל זרימת OAuth 2.0 (כולל PKCE + access_type=offline לקבלת refresh_token קבוע) */
export async function startGoogleOAuthFlow(origin: string): Promise<{
  authUrl: string;
  state: string;
  redirectUri: string;
  needsManualCallbackPaste: boolean;
}> {
  pruneStates();
  const stored = await getStoredConfig();
  const { client } = resolveOAuthClient(stored);
  if (!client?.clientId || !client?.clientSecret) {
    throw new Error(
      "יש להזין תחילה Client ID ו-Client Secret של Google Cloud (או להעלות קובץ JSON).",
    );
  }

  const { redirectUri, needsManualCallbackPaste } = computeRedirectUri(origin, client);
  const state = base64url(crypto.randomBytes(24));
  const codeVerifier = base64url(crypto.randomBytes(32));
  const codeChallenge = base64url(
    crypto.createHash("sha256").update(codeVerifier).digest(),
  );

  pendingStates.set(state, {
    codeVerifier,
    redirectUri,
    createdAt: Date.now(),
  });

  const params = new URLSearchParams({
    client_id: client.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_OAUTH_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent select_account",
    include_granted_scopes: "true",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return {
    authUrl: `${AUTH_URL}?${params.toString()}`,
    state,
    redirectUri,
    needsManualCallbackPaste,
  };
}

/** מחלץ code ו-state מתוך כתובת מלאה שהודבקה או קוד אישור גולמי */
export function parseAuthorizationInput(raw: string): {
  code: string;
  state?: string;
  redirectUri?: string;
  oauthError?: string;
} {
  const trimmed = raw.trim();
  if (!trimmed) return { code: "" };

  if (trimmed.includes("://") || trimmed.startsWith("?")) {
    try {
      const u = trimmed.startsWith("?")
        ? new URL(`http://127.0.0.1/api/google/callback${trimmed}`)
        : new URL(trimmed);
      return {
        code: u.searchParams.get("code")?.trim() || "",
        state: u.searchParams.get("state")?.trim() || undefined,
        redirectUri: trimmed.startsWith("?") ? undefined : `${u.origin}${u.pathname}`,
        oauthError: u.searchParams.get("error")?.trim() || undefined,
      };
    } catch {
      /* treat as raw code below */
    }
  }
  return { code: trimmed };
}

/** משלים את החיבור: מחליף code בטוקנים, מושך פרטי משתמש ושומר לצמיתות ב-PostgreSQL */
export async function completeGoogleOAuthFlow(params: {
  code: string;
  state?: string;
  requireValidState: boolean;
  originFallback?: string;
  redirectUriHint?: string;
}): Promise<StoredGoogleAccount> {
  pruneStates();
  const stored = await getStoredConfig();
  const { client } = resolveOAuthClient(stored);
  if (!client?.clientId || !client?.clientSecret) {
    throw new Error("מפתחות ה-OAuth אינם מוגדרים במערכת");
  }

  const pending = params.state ? pendingStates.get(params.state) : undefined;
  if (params.requireValidState && !pending) {
    throw new Error("פג תוקף בקשת ההתחברות (state לא תקף). נא ללחוץ שוב על 'התחבר עם Google'.");
  }
  if (params.state) pendingStates.delete(params.state);

  const redirectUri =
    pending?.redirectUri ||
    params.redirectUriHint ||
    computeRedirectUri(params.originFallback || "http://127.0.0.1:3000", client).redirectUri;

  const body = new URLSearchParams({
    code: params.code,
    client_id: client.clientId,
    client_secret: client.clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  if (pending?.codeVerifier) {
    body.set("code_verifier", pending.codeVerifier);
  }

  const tokenRes = await fetch(getTokenUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(20000),
  });
  const tokenData = (await tokenRes.json().catch(() => ({}))) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    error?: string;
    error_description?: string;
  };

  if (!tokenRes.ok || !tokenData.access_token) {
    const desc = tokenData.error_description || tokenData.error || `HTTP ${tokenRes.status}`;
    if (tokenData.error === "redirect_uri_mismatch") {
      throw new Error(
        `כתובת ה-Redirect URI לא תואמת (${redirectUri}). הוסף כתובת זו ב-Google Cloud Console או השתמש במפתח מסוג Desktop App.`,
      );
    }
    throw new Error(`החלפת קוד האישור מול Google נכשלה: ${desc}`);
  }

  // משיכת פרטי החשבון (אימייל, שם, תמונה)
  let email = "";
  let name: string | undefined;
  let picture: string | undefined;
  try {
    const profileRes = await fetch(getUserInfoUrl(), {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
      signal: AbortSignal.timeout(12000),
    });
    if (profileRes.ok) {
      const profile = (await profileRes.json()) as {
        email?: string;
        name?: string;
        picture?: string;
      };
      email = profile.email?.trim() || "";
      name = profile.name?.trim() || undefined;
      picture = profile.picture?.trim() || undefined;
    }
  } catch (err) {
    console.warn("[google-oauth] userinfo fetch failed:", err);
  }

  const refreshToken =
    tokenData.refresh_token?.trim() ||
    (stored.googleAccount && (!email || stored.googleAccount.email === email)
      ? stored.googleAccount.refreshToken
      : "");

  if (!refreshToken) {
    throw new Error(
      "Google לא החזירה refresh_token קבוע. נסה להתחבר שוב ואשר את כל ההרשאות במסך ההסכמה.",
    );
  }

  const account: StoredGoogleAccount = {
    email: email || stored.googleAccount?.email || "חשבון Google מחובר",
    name,
    picture,
    refreshToken,
    accessToken: tokenData.access_token,
    expiresAt: Date.now() + (tokenData.expires_in ?? 3600) * 1000,
    scope: tokenData.scope,
    connectedAt: new Date().toISOString(),
  };

  await saveGoogleAccount(account);
  return account;
}

/**
 * מחזיר access_token תקף של חשבון ה-Google השמור.
 * אם פג תוקפו — מחדש אותו אוטומטית מול Google ושומר את הטוקן החדש במסד הנתונים.
 */
export async function getGoogleAuthToken(): Promise<{
  token: string;
  email: string;
} | null> {
  const stored = await getStoredConfig();
  const envRefresh = process.env.GOOGLE_REFRESH_TOKEN?.trim() || "";
  const account: StoredGoogleAccount | null =
    stored.googleAccount ??
    (envRefresh
      ? {
          email: process.env.GOOGLE_ACCOUNT_EMAIL?.trim() || "חשבון Google (משתנה סביבה)",
          refreshToken: envRefresh,
          accessToken: "",
          expiresAt: 0,
          connectedAt: "",
        }
      : null);

  if (!account) return null;

  // התחברות דרך חלון Google יכולה להחזיר access token תקף ללא refresh token.
  if (account.accessToken && account.expiresAt - 90_000 > Date.now()) {
    return { token: account.accessToken, email: account.email };
  }

  // אם זו התחברות זמנית והטוקן פג — נדרשת התחברות מחדש בדפדפן.
  if (!account.refreshToken) return null;

  if (g.__kioskOAuthRefreshPromise) {
    return g.__kioskOAuthRefreshPromise;
  }

  const { client } = resolveOAuthClient(stored);
  if (!client?.clientId || !client?.clientSecret) {
    throw new Error(
      "חשבון Google שמור במערכת אך חסרים Client ID / Client Secret לחידוש הטוקן.",
    );
  }

  const promise = (async () => {
    const res = await fetch(getTokenUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: client.clientId,
        client_secret: client.clientSecret,
        refresh_token: account.refreshToken,
        grant_type: "refresh_token",
      }),
      signal: AbortSignal.timeout(15000),
    });

    const data = (await res.json().catch(() => ({}))) as {
      access_token?: string;
      expires_in?: number;
      refresh_token?: string;
      error?: string;
      error_description?: string;
    };

    if (!res.ok || !data.access_token) {
      if (data.error === "invalid_grant") {
        throw new Error(
          `פג תוקף ההרשאה של חשבון Google (${account.email}) — אם האפליקציה ב-Google Cloud במצב Testing תוקף הטוקן הוא 7 ימים (מומלץ ללחוץ שם על Publish App). היכנס לניהול ← חשבון Google ודרייב והתחבר מחדש בלחיצה אחת.`,
        );
      }
      throw new Error(
        `חידוש טוקן Google נכשל: ${data.error_description || data.error || res.status}`,
      );
    }

    const expiresAt = Date.now() + (data.expires_in ?? 3600) * 1000;
    if (stored.googleAccount) {
      await updateRefreshedGoogleToken({
        expectedRefreshToken: account.refreshToken,
        accessToken: data.access_token,
        expiresAt,
        newRefreshToken: data.refresh_token?.trim() || undefined,
      });
    }

    return { token: data.access_token, email: account.email };
  })().finally(() => {
    g.__kioskOAuthRefreshPromise = undefined;
  });

  g.__kioskOAuthRefreshPromise = promise;
  return promise;
}

/** בונה אובייקט סטטוס מלא למסך הניהול (ללא חשיפת סודות או טוקנים) */
export async function buildGoogleAuthStatus(
  serviceAccountEmail: string | null,
): Promise<GoogleAuthStatus> {
  const stored = await getStoredConfig();
  const { source, client } = resolveOAuthClient(stored);
  const savedAccount = stored.googleAccount;
  const acc =
    savedAccount &&
    (Boolean(savedAccount.refreshToken) ||
      Boolean(savedAccount.accessToken && savedAccount.expiresAt - 90_000 > Date.now()))
      ? savedAccount
      : null;
  const scopeStr = acc?.scope ?? "";

  return {
    connected: Boolean(acc),
    account: acc
      ? {
          email: acc.email,
          name: acc.name,
          picture: acc.picture,
          connectedAt: acc.connectedAt,
          hasRefreshToken: Boolean(acc.refreshToken),
          scopes: {
            drive: !scopeStr || scopeStr.includes("drive"),
            sheets: !scopeStr || scopeStr.includes("spreadsheets"),
          },
        }
      : null,
    oauthClient: {
      configured: Boolean(client?.clientId && client?.clientSecret),
      source,
      clientId: client?.clientId ?? "",
      hasClientSecret: Boolean(client?.clientSecret),
      maskedSecret: maskSecret(client?.clientSecret ?? ""),
      clientType: client?.clientType ?? "web",
      redirectUriOverride: client?.redirectUriOverride ?? "",
    },
    serviceAccountEmail,
  };
}
