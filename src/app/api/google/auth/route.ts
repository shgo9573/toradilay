import { checkAdmin } from "@/lib/server/guard";
import { startGoogleOAuthFlow } from "@/lib/server/google-oauth";
import { saveGoogleOAuthClient } from "@/lib/server/settings";

export const dynamic = "force-dynamic";

function resolveRequestOrigin(req: Request, bodyOrigin?: string): string {
  if (bodyOrigin) {
    try {
      const u = new URL(bodyOrigin);
      if (u.protocol === "http:" || u.protocol === "https:") {
        return u.origin;
      }
    } catch {
      /* fallback below */
    }
  }
  const proto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const host = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (proto && host) return `${proto}://${host}`;
  return new URL(req.url).origin;
}

/** שומר מפתחות OAuth (אם נשלחו) ומחזיר כתובת התחברות רשמית ל-Google */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      pin?: string;
      origin?: string;
      client?: {
        clientId?: string;
        clientSecret?: string;
        clientType?: "web" | "installed";
        redirectUriOverride?: string;
      };
    };

    const check = await checkAdmin(body.pin);
    if (!check.ok) {
      return Response.json({ ok: false, error: check.error }, { status: check.status });
    }

    if (body.client && (body.client.clientId !== undefined || body.client.clientSecret !== undefined)) {
      await saveGoogleOAuthClient(body.client);
    }

    const origin = resolveRequestOrigin(req, body.origin);
    const flow = await startGoogleOAuthFlow(origin);
    return Response.json({ ok: true, ...flow });
  } catch (err) {
    const message = err instanceof Error ? err.message : "לא ניתן להתחיל התחברות ל-Google";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
