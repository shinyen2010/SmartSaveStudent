import { Router } from "express";
import { db } from "@workspace/db";
import { budgetsTable, expensesTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import {
  CreateBudgetBody,
  UpdateBudgetBody,
  ListBudgetsQueryParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/budgets", async (req, res) => {
  const parsed = ListBudgetsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }
  const month = parsed.data.month ?? new Date().toISOString().slice(0, 7);

  const budgets = await db
    .select()
    .from(budgetsTable)
    .where(eq(budgetsTable.month, month));

  const result = await Promise.all(
    budgets.map(async (b) => {
      const [{ total }] = await db
        .select({ total: sql<string>`coalesce(sum(${expensesTable.amount}), 0)` })
        .from(expensesTable)
        .where(
          and(
            eq(expensesTable.category, b.category),
            sql`to_char(${expensesTable.date}::date, 'YYYY-MM') = ${b.month}`
          )
        );
      const currentSpend = Number(total);
      const monthlyLimit = Number(b.monthlyLimit);
      const percentUsed = monthlyLimit > 0 ? (currentSpend / monthlyLimit) * 100 : 0;
      return {
        ...b,
        monthlyLimit,
        currentSpend,
        percentUsed: Math.round(percentUsed * 10) / 10,
        isOverBudget: currentSpend > monthlyLimit,
        createdAt: b.createdAt.toISOString(),
      };
    })
  );

  res.json(result);
});

router.post("/budgets", async (req, res) => {
  const parsed = CreateBudgetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const [row] = await db
    .insert(budgetsTable)
    .values({
      category: parsed.data.category,
      monthlyLimit: String(parsed.data.monthlyLimit),
      month: parsed.data.month,
    })
    .returning();
  res.status(201).json({
    ...row,
    monthlyLimit: Number(row.monthlyLimit),
    currentSpend: 0,
    percentUsed: 0,
    isOverBudget: false,
    createdAt: row.createdAt.toISOString(),
  });
});

router.patch("/budgets/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const parsed = UpdateBudgetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const [row] = await db
    .update(budgetsTable)
    .set({ monthlyLimit: String(parsed.data.monthlyLimit) })
    .where(eq(budgetsTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({
    ...row,
    monthlyLimit: Number(row.monthlyLimit),
    currentSpend: 0,
    percentUsed: 0,
    isOverBudget: false,
    createdAt: row.createdAt.toISOString(),
  });
});

router.delete("/budgets/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(budgetsTable).where(eq(budgetsTable.id, id));
  res.status(204).send();
});

export default router;
