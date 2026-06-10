import { Router } from "express";
import { db } from "@workspace/db";
import { goalsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CreateGoalBody, UpdateGoalBody, ContributeToGoalBody } from "@workspace/api-zod";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";

const router = Router();

function formatGoal(row: typeof goalsTable.$inferSelect) {
  const target = Number(row.targetAmount);
  const current = Number(row.currentAmount);
  return { ...row, targetAmount: target, currentAmount: current, percentComplete: target > 0 ? Math.min(Math.round((current / target) * 1000) / 10, 100) : 0, createdAt: row.createdAt.toISOString() };
}

router.get("/goals", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const rows = await db.select().from(goalsTable).where(eq(goalsTable.userId, userId)).orderBy(goalsTable.createdAt);
  res.json(rows.map(formatGoal));
});

router.post("/goals", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const parsed = CreateGoalBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }
  const [row] = await db.insert(goalsTable).values({
    userId,
    name: parsed.data.name,
    targetAmount: String(parsed.data.targetAmount),
    currentAmount: "0",
    deadline: parsed.data.deadline ?? null,
    icon: parsed.data.icon ?? "target",
  }).returning();
  res.status(201).json(formatGoal(row));
});

router.patch("/goals/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const id = parseInt(req.params.id);
  const parsed = UpdateGoalBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }
  const vals: Partial<typeof goalsTable.$inferInsert> = {};
  if (parsed.data.name !== undefined) vals.name = parsed.data.name;
  if (parsed.data.targetAmount !== undefined) vals.targetAmount = String(parsed.data.targetAmount);
  if (parsed.data.deadline !== undefined) vals.deadline = parsed.data.deadline;
  if (parsed.data.icon !== undefined) vals.icon = parsed.data.icon;
  const [row] = await db.update(goalsTable).set(vals).where(and(eq(goalsTable.id, id), eq(goalsTable.userId, userId))).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatGoal(row));
});

router.delete("/goals/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const id = parseInt(req.params.id);
  await db.delete(goalsTable).where(and(eq(goalsTable.id, id), eq(goalsTable.userId, userId)));
  res.status(204).send();
});

router.post("/goals/:id/contribute", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const id = parseInt(req.params.id);
  const parsed = ContributeToGoalBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }
  const [existing] = await db.select().from(goalsTable).where(and(eq(goalsTable.id, id), eq(goalsTable.userId, userId)));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  const newAmount = Number(existing.currentAmount) + parsed.data.amount;
  const [row] = await db.update(goalsTable).set({ currentAmount: String(newAmount), isCompleted: newAmount >= Number(existing.targetAmount) }).where(and(eq(goalsTable.id, id), eq(goalsTable.userId, userId))).returning();
  res.json(formatGoal(row));
});

export default router;
