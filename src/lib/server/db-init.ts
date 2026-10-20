import { sql } from "drizzle-orm";
import { db } from "@/db";

const g = globalThis as typeof globalThis & { __kioskTablesReady?: Promise<void> };

/**
 * מוודא שהטבלאות קיימות (CREATE TABLE IF NOT EXISTS) — כך שהמערכת עולה
 * גם על מסד נקי, בלי להסתמך על הרצה ידנית של drizzle-kit.
 */
export function ensureTables(): Promise<void> {
  if (!g.__kioskTablesReady) {
    g.__kioskTablesReady = (async () => {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS kiosk_settings (
          id integer PRIMARY KEY,
          data jsonb NOT NULL,
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS kiosk_activity (
          id serial PRIMARY KEY,
          type varchar(24) NOT NULL,
          student_ref varchar(32),
          file_name text,
          detail text,
          success boolean NOT NULL DEFAULT true,
          created_at timestamptz NOT NULL DEFAULT now()
        )
      `);
    })().catch((err) => {
      g.__kioskTablesReady = undefined;
      throw err;
    });
  }
  return g.__kioskTablesReady;
}
