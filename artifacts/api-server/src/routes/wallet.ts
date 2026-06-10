import { Router } from "express";
import { db } from "@workspace/db";
import { walletTransactionsTable, expensesTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { WalletTopUpBody, WalletPayBody, WalletTransferBody } from "@workspace/api-zod";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";

const router = Router();

function genRef() {
  return "TNG" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
}

async function computeBalance(userId: string) {
  const [inflow] = await db
    .select({ total: sql<string>`coalesce(sum(${walletTransactionsTable.amount}), 0)` })
    .from(walletTransactionsTable)
    .where(
      and(
        eq(walletTransactionsTable.userId, userId),
        sql`${walletTransactionsTable.type} IN ('topup', 'transfer_in', 'cashback')`
      )
    );

  const [outflow] = await db
    .select({ total: sql<string>`coalesce(sum(${walletTransactionsTable.amount}), 0)` })
    .from(walletTransactionsTable)
    .where(
      and(
        eq(walletTransactionsTable.userId, userId),
        sql`${walletTransactionsTable.type} IN ('payment', 'transfer_out')`
      )
    );

  const [topups] = await db
    .select({ total: sql<string>`coalesce(sum(${walletTransactionsTable.amount}), 0)` })
    .from(walletTransactionsTable)
    .where(and(eq(walletTransactionsTable.userId, userId), eq(walletTransactionsTable.type, "topup")));

  const [payments] = await db
    .select({ total: sql<string>`coalesce(sum(${walletTransactionsTable.amount}), 0)` })
    .from(walletTransactionsTable)
    .where(and(eq(walletTransactionsTable.userId, userId), eq(walletTransactionsTable.type, "payment")));

  const [transferred] = await db
    .select({ total: sql<string>`coalesce(sum(${walletTransactionsTable.amount}), 0)` })
    .from(walletTransactionsTable)
    .where(and(eq(walletTransactionsTable.userId, userId), eq(walletTransactionsTable.type, "transfer_out")));

  return {
    balance: Math.max(0, Number(inflow.total) - Number(outflow.total)),
    totalTopUps: Number(topups.total),
    totalSpent: Number(payments.total),
    totalTransferred: Number(transferred.total),
  };
}

function fmt(row: typeof walletTransactionsTable.$inferSelect) {
  return {
    id: row.id,
    type: row.type,
    amount: Number(row.amount),
    description: row.description,
    category: row.category,
    referenceNo: row.referenceNo,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/wallet/balance", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  res.json(await computeBalance(userId));
});

router.get("/wallet/transactions", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  const rows = await db
    .select()
    .from(walletTransactionsTable)
    .where(eq(walletTransactionsTable.userId, userId))
    .orderBy(sql`${walletTransactionsTable.createdAt} desc`)
    .limit(limit);
  res.json(rows.map(fmt));
});

router.post("/wallet/topup", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const parsed = WalletTopUpBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }
  const [row] = await db
    .insert(walletTransactionsTable)
    .values({
      userId,
      type: "topup",
      amount: String(parsed.data.amount),
      description: `Top Up via ${parsed.data.method ?? "Bank Transfer"}`,
      referenceNo: genRef(),
      status: "completed",
    })
    .returning();
  res.status(201).json(fmt(row));
});

router.post("/wallet/pay", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const parsed = WalletPayBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }

  const { balance } = await computeBalance(userId);
  if (parsed.data.amount > balance) {
    res.status(400).json({ error: "Insufficient balance" });
    return;
  }

  const [row] = await db
    .insert(walletTransactionsTable)
    .values({
      userId,
      type: "payment",
      amount: String(parsed.data.amount),
      description: parsed.data.description,
      category: parsed.data.category ?? null,
      referenceNo: genRef(),
      status: "completed",
    })
    .returning();

  if (parsed.data.createExpense && parsed.data.category) {
    await db.insert(expensesTable).values({
      userId,
      amount: String(parsed.data.amount),
      category: parsed.data.category,
      description: parsed.data.description,
      date: new Date().toISOString().slice(0, 10),
    });
  }

  res.status(201).json(fmt(row));
});

router.post("/wallet/transfer", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const parsed = WalletTransferBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }

  const { balance } = await computeBalance(userId);
  if (parsed.data.amount > balance) {
    res.status(400).json({ error: "Insufficient balance" });
    return;
  }

  const note = parsed.data.note ? ` — ${parsed.data.note}` : "";
  const [row] = await db
    .insert(walletTransactionsTable)
    .values({
      userId,
      type: "transfer_out",
      amount: String(parsed.data.amount),
      description: `Transfer to ${parsed.data.recipient}${note}`,
      referenceNo: genRef(),
      status: "completed",
    })
    .returning();

  res.status(201).json(fmt(row));
});

export default router;
