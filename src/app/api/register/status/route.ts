import { getStoredConfig, verifyPin } from "@/lib/server/settings";
import { loadServiceAccount } from "@/lib/server/sheets";
import type { RegistrationStatus, SheetsMethod } from "@/lib/types";

export const dynamic = "force-dynamic";

/** מצב חיבור הרישום. עם כותרת x-admin-pin תקינה מוחזרים גם פרטי החיבור המלאים */
export async function GET(req: Request) {
  const cfg = await getStoredConfig();
  const sa = loadServiceAccount();
  const hasOAuth = Boolean(
    cfg.googleAccount?.refreshToken || process.env.GOOGLE_REFRESH_TOKEN?.trim(),
  );

  const method: SheetsMethod | null = hasOAuth
    ? "oauth"
    : sa
      ? "service-account"
      : cfg.sheetsWebhookUrl
        ? "webhook"
        : null;

  const status: RegistrationStatus = {
    enabled: cfg.registrationEnabled,
    configured: method !== null,
    method,
    spreadsheetId: cfg.spreadsheetId,
  };

  const pin = req.headers.get("x-admin-pin");
  if (pin && (await verifyPin(pin))) {
    status.googleAccountEmail = cfg.googleAccount?.email ?? null;
    status.serviceAccountEmail = sa?.client_email ?? null;
    status.webhookUrl = cfg.sheetsWebhookUrl;
  }

  return Response.json(status);
}
