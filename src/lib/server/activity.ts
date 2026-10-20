import { desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { kioskActivity } from "@/db/schema";
import type { StatsResponse } from "@/lib/types";
import { ensureTables } from "./db-init";

export type ActivityType = "search" | "miss" | "print" | "copy" | "exit" | "register";

/** מסתיר את רוב ספרות תעודת הזהות ביומן (••••••123) */
export function maskId(id?: string | null): string | null {
  if (!id) return null;
  const digits = String(id).replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length <= 3) return digits;
  return "•".repeat(digits.length - 3) + digits.slice(-3);
}

export async function logActivity(entry: {
  type: ActivityType;
  studentId?: string | null;
  fileName?: string | null;
  detail?: string | null;
  success?: boolean;
}): Promise<void> {
  try {
    await ensureTables();
    await db.insert(kioskActivity).values({
      type: entry.type,
      studentRef: maskId(entry.studentId),
      fileName: entry.fileName?.slice(0, 300) ?? null,
      detail: entry.detail?.slice(0, 500) ?? null,
      success: entry.success ?? true,
    });
  } catch (err) {
    console.error("[activity] failed to log:", err);
  }
}

export async function getStats(): Promise<StatsResponse> {
  await ensureTables();

  const totalsRes = await db.execute(sql`
    SELECT
      count(*) FILTER (WHERE type = 'print' AND success) AS prints,
      count(*) FILTER (WHERE type = 'copy' AND success) AS copies,
      count(*) FILTER (WHERE type = 'search') AS searches,
      count(*) FILTER (WHERE type = 'miss') AS misses,
      count(*) FILTER (WHERE type = 'register' AND success) AS registrations,
      min(created_at) AS since
    FROM kiosk_activity
  `);
  const t = (totalsRes.rows[0] ?? {}) as Record<string, unknown>;

  const dailyRes = await db.execute(sql`
    SELECT
      to_char(d::date, 'YYYY-MM-DD') AS date,
      coalesce(sum(CASE WHEN a.type = 'print' AND a.success THEN 1 ELSE 0 END), 0) AS prints,
      coalesce(sum(CASE WHEN a.type = 'copy' AND a.success THEN 1 ELSE 0 END), 0) AS copies
    FROM generate_series(current_date - interval '6 days', current_date, interval '1 day') AS d
    LEFT JOIN kiosk_activity a ON a.created_at::date = d::date
    GROUP BY d
    ORDER BY d
  `);

  const recentRows = await db
    .select()
    .from(kioskActivity)
    .orderBy(desc(kioskActivity.id))
    .limit(25);

  return {
    totals: {
      prints: Number(t.prints ?? 0),
      copies: Number(t.copies ?? 0),
      searches: Number(t.searches ?? 0),
      misses: Number(t.misses ?? 0),
      registrations: Number(t.registrations ?? 0),
    },
    since: t.since ? new Date(String(t.since)).toISOString() : null,
    daily: dailyRes.rows.map((r) => {
      const row = r as Record<string, unknown>;
      return {
        date: String(row.date),
        prints: Number(row.prints ?? 0),
        copies: Number(row.copies ?? 0),
      };
    }),
    recent: recentRows.map((r) => ({
      id: r.id,
      type: r.type,
      studentRef: r.studentRef,
      fileName: r.fileName,
      detail: r.detail,
      success: r.success,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}
