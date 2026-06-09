import { Router } from "express";
import { db } from "@workspace/db";
import { userSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateSettingsBody } from "@workspace/api-zod";

const router = Router();

const DEFAULT_USER = "default";

async function getOrCreateSettings(userId: string) {
  const [existing] = await db
    .select()
    .from(userSettingsTable)
    .where(eq(userSettingsTable.userId, userId));
  if (existing) return existing;
  const [created] = await db
    .insert(userSettingsTable)
    .values({ userId })
    .returning();
  return created;
}

router.get("/settings", async (req, res) => {
  const row = await getOrCreateSettings(DEFAULT_USER);
  res.json({ ...row, updatedAt: row.updatedAt.toISOString() });
});

router.put("/settings", async (req, res) => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const data = parsed.data;
  await getOrCreateSettings(DEFAULT_USER);
  const [row] = await db
    .update(userSettingsTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(userSettingsTable.userId, DEFAULT_USER))
    .returning();
  res.json({ ...row, updatedAt: row.updatedAt.toISOString() });
});

export default router;
