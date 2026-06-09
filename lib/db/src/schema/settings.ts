import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userSettingsTable = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique().default("default"),
  moneyPersonality: text("money_personality").notNull().default("balancer"),
  savingsAggressiveness: text("savings_aggressiveness").notNull().default("moderate"),
  budgetAlertThreshold: integer("budget_alert_threshold").notNull().default(75),
  weeklyDigest: boolean("weekly_digest").notNull().default(true),
  displayName: text("display_name"),
  currency: text("currency").notNull().default("RM"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSettingsSchema = createInsertSchema(userSettingsTable).omit({ id: true, updatedAt: true });
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UserSettings = typeof userSettingsTable.$inferSelect;
