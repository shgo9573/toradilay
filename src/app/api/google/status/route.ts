import { checkAdmin } from "@/lib/server/guard";
import { buildGoogleAuthStatus } from "@/lib/server/google-oauth";
import { loadServiceAccount } from "@/lib/server/sheets";

export const dynamic = "force-dynamic";

/** מחזיר למנהל את מצב החיבור הקבוע לחשבון Google (ללא חשיפת סודות) */
export async function GET(req: Request) {
  const check = await checkAdmin(req.headers.get("x-admin-pin"));
  if (!check.ok) {
    return Response.json({ error: check.error }, { status: check.status });
  }
  const sa = loadServiceAccount();
  const status = await buildGoogleAuthStatus(sa?.client_email ?? null);
  return Response.json(status);
}
