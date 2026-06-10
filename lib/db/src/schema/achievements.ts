import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const achievementsTable = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().default("legacy"),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  isUnlocked: boolean("is_unlocked").notNull().default(false),
  unlockedAt: timestamp("unlocked_at"),
  xpValue: integer("xp_value").notNull().default(50),
});

export type Achievement = typeof achievementsTable.$inferSelect;
