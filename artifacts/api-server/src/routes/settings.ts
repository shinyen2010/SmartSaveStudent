import { Router } from "express";
import { db } from "@workspace/db";
import { userSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateSettingsBody } from "@workspace/api-zod";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";

const router = Router();

async function getOrCreateSettings(userId: string) {
  const [existing] = await db.select().from(userSettingsTable).where(eq(userSettingsTable.userId, userId));
  if (existing) return existing;
  const [created] = await db.insert(userSettingsTable).values({ userId }).returning();
  return created;
}

router.get("/settings", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const row = await getOrCreateSettings(userId);
  res.json({ ...row, updatedAt: row.updatedAt.toISOString() });
});

router.put("/settings", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }
  await getOrCreateSettings(userId);
  const [row] = await db.update(userSettingsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(userSettingsTable.userId, userId)).returning();
  res.json({ ...row, updatedAt: row.updatedAt.toISOString() });
});

export default router;
