import { pgTable, serial, text, numeric, timestamp } from "drizzle-orm/pg-core";

export const walletTransactionsTable = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type").notNull(), // 'topup' | 'payment' | 'transfer_out' | 'transfer_in' | 'cashback'
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  category: text("category"),
  referenceNo: text("reference_no").notNull(),
  status: text("status").notNull().default("completed"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type WalletTransaction = typeof walletTransactionsTable.$inferSelect;
