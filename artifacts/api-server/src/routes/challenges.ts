import { Router } from "express";
import { db } from "@workspace/db";
import { challengesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CreateChallengeBody, UpdateChallengeBody } from "@workspace/api-zod";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";

const router = Router();

function formatChallenge(row: typeof challengesTable.$inferSelect) {
  const target = Number(row.targetAmount);
  const current = Number(row.currentAmount);
  return { ...row, targetAmount: target, currentAmount: current, xpReward: row.xpReward, percentComplete: target > 0 ? Math.min(Math.round((current / target) * 1000) / 10, 100) : 0, createdAt: row.createdAt.toISOString() };
}

router.get("/challenges", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const rows = await db.select().from(challengesTable).where(eq(challengesTable.userId, userId)).orderBy(challengesTable.createdAt);
  res.json(rows.map(formatChallenge));
});

router.post("/challenges", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const parsed = CreateChallengeBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }
  const [row] = await db.insert(challengesTable).values({
    userId,
    name: parsed.data.name,
    description: parsed.data.description,
    targetAmount: String(parsed.data.targetAmount),
    currentAmount: "0",
    startDate: parsed.data.startDate ?? null,
    endDate: parsed.data.endDate ?? null,
    xpReward: parsed.data.xpReward ?? 100,
    status: "active",
  }).returning();
  res.status(201).json(formatChallenge(row));
});

router.patch("/challenges/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const id = parseInt(req.params.id);
  const parsed = UpdateChallengeBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }
  const vals: Partial<typeof challengesTable.$inferInsert> = {};
  if (parsed.data.currentAmount !== undefined) vals.currentAmount = String(parsed.data.currentAmount);
  if (parsed.data.status !== undefined) vals.status = parsed.data.status;
  const [row] = await db.update(challengesTable).set(vals).where(and(eq(challengesTable.id, id), eq(challengesTable.userId, userId))).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatChallenge(row));
});

export default router;
