import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * הגדרות העמדה (שורה אחת, id = 1). כל ההגדרות — כולל האפקטים — נשמרות כ-JSON.
 */
export const kioskSettings = pgTable("kiosk_settings", {
  id: integer("id").primaryKey(),
  data: jsonb("data").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * יומן פעילות העמדה: חיפושים, הדפסות, העתקות ויציאות.
 * מספר הזהות נשמר מוסתר חלקית (••••••123).
 */
export const kioskActivity = pgTable("kiosk_activity", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 24 }).notNull(),
  studentRef: varchar("student_ref", { length: 32 }),
  fileName: text("file_name"),
  detail: text("detail"),
  success: boolean("success").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
