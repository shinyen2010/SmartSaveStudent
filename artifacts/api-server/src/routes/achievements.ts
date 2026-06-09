import { Router } from "express";
import { db } from "@workspace/db";
import { achievementsTable } from "@workspace/db";

const router = Router();

router.get("/achievements", async (_req, res) => {
  const rows = await db.select().from(achievementsTable).orderBy(achievementsTable.id);
  res.json(
    rows.map((r) => ({
      ...r,
      unlockedAt: r.unlockedAt ? r.unlockedAt.toISOString() : null,
    }))
  );
});

export default router;
