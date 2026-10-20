import { checkAdmin } from "@/lib/server/guard";
import {
  buildGoogleAuthStatus,
  parseClientSecretJson,
} from "@/lib/server/google-oauth";
import { saveGoogleOAuthClient } from "@/lib/server/settings";
import { loadServiceAccount } from "@/lib/server/sheets";

export const dynamic = "force-dynamic";

/** שמירה או פענוח של מפתחות OAuth של Google (ידנית או מקובץ client_secret.json) */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      pin?: string;
      clear?: boolean;
      clientSecretJson?: string;
      clientId?: string;
      clientSecret?: string;
      clientType?: "web" | "installed";
      redirectUriOverride?: string;
    };

    const check = await checkAdmin(body.pin);
    if (!check.ok) {
      return Response.json({ error: check.error }, { status: check.status });
    }

    if (body.clear) {
      await saveGoogleOAuthClient(null);
      const sa = loadServiceAccount();
      return Response.json({
        ok: true,
        status: await buildGoogleAuthStatus(sa?.client_email ?? null),
      });
    }

    if (body.clientSecretJson) {
      const parsed = parseClientSecretJson(body.clientSecretJson);
      if (!parsed) {
        return Response.json(
          {
            ok: false,
            error:
              "קובץ ה-JSON אינו מכיל client_id ו-client_secret תקינים. הורד קובץ OAuth 2.0 Client ID מ-Google Cloud Console.",
          },
          { status: 400 },
        );
      }
      await saveGoogleOAuthClient(parsed);
      const sa = loadServiceAccount();
      return Response.json({
        ok: true,
        status: await buildGoogleAuthStatus(sa?.client_email ?? null),
      });
    }

    await saveGoogleOAuthClient({
      clientId: body.clientId,
      clientSecret: body.clientSecret,
      clientType: body.clientType,
      redirectUriOverride: body.redirectUriOverride,
    });

    const sa = loadServiceAccount();
    return Response.json({
      ok: true,
      status: await buildGoogleAuthStatus(sa?.client_email ?? null),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "שמירת מפתחות ה-OAuth נכשלה";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
