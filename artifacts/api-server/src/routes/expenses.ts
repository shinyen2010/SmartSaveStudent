import { Router } from "express";
import { db } from "@workspace/db";
import { expensesTable } from "@workspace/db";
import { eq, like, and, sql } from "drizzle-orm";
import { CreateExpenseBody, UpdateExpenseBody, ListExpensesQueryParams } from "@workspace/api-zod";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";

const router = Router();

router.get("/expenses", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const parsed = ListExpensesQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: "Invalid query params" }); return; }
  const { category, month, search } = parsed.data;

  const conditions = [eq(expensesTable.userId, userId)];
  if (category) conditions.push(eq(expensesTable.category, category));
  if (month) conditions.push(sql`to_char(${expensesTable.date}::date, 'YYYY-MM') = ${month}`);
  if (search) conditions.push(like(expensesTable.description, `%${search}%`));

  const rows = await db
    .select().from(expensesTable)
    .where(and(...conditions))
    .orderBy(sql`${expensesTable.date} desc`);

  res.json(rows.map((r) => ({ ...r, amount: Number(r.amount), createdAt: r.createdAt.toISOString() })));
});

router.post("/expenses", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const parsed = CreateExpenseBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }
  const [row] = await db.insert(expensesTable).values({
    userId,
    amount: String(parsed.data.amount),
    category: parsed.data.category,
    description: parsed.data.description,
    date: parsed.data.date,
    mood: parsed.data.mood ?? null,
  }).returning();
  res.status(201).json({ ...row, amount: Number(row.amount), createdAt: row.createdAt.toISOString() });
});

router.get("/expenses/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const id = parseInt(req.params.id);
  const [row] = await db.select().from(expensesTable)
    .where(and(eq(expensesTable.id, id), eq(expensesTable.userId, userId)));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, amount: Number(row.amount), createdAt: row.createdAt.toISOString() });
});

router.patch("/expenses/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const id = parseInt(req.params.id);
  const parsed = UpdateExpenseBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }
  const data = parsed.data;
  const updateVals: Partial<typeof expensesTable.$inferInsert> = {};
  if (data.amount !== undefined) updateVals.amount = String(data.amount);
  if (data.category !== undefined) updateVals.category = data.category;
  if (data.description !== undefined) updateVals.description = data.description;
  if (data.date !== undefined) updateVals.date = data.date;
  if (data.mood !== undefined) updateVals.mood = data.mood;

  const [row] = await db.update(expensesTable).set(updateVals)
    .where(and(eq(expensesTable.id, id), eq(expensesTable.userId, userId))).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, amount: Number(row.amount), createdAt: row.createdAt.toISOString() });
});

router.delete("/expenses/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const id = parseInt(req.params.id);
  await db.delete(expensesTable).where(and(eq(expensesTable.id, id), eq(expensesTable.userId, userId)));
  res.status(204).send();
});

export default router;
