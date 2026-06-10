import { Router } from "express";
import { db } from "@workspace/db";
import { achievementsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";

const router = Router();

const DEFAULT_ACHIEVEMENTS = [
  { name: "First Step", description: "Log your first expense", icon: "footprints", xpValue: 50 },
  { name: "Budget Setter", description: "Create your first budget", icon: "pie-chart", xpValue: 75 },
  { name: "Goal Setter", description: "Create your first savings goal", icon: "target", xpValue: 75 },
  { name: "Saver", description: "Reach 50% of a savings goal", icon: "piggy-bank", xpValue: 100 },
  { name: "Goal Crusher", description: "Complete a savings goal", icon: "trophy", xpValue: 200 },
  { name: "Challenge Accepted", description: "Join your first challenge", icon: "zap", xpValue: 50 },
  { name: "Challenge Champion", description: "Complete a challenge", icon: "medal", xpValue: 150 },
  { name: "Budget Master", description: "Stay within all budgets for a month", icon: "shield-check", xpValue: 200 },
  { name: "Streak Week", description: "Log expenses 7 days in a row", icon: "flame", xpValue: 100 },
  { name: "Big Saver", description: "Save over RM1000 across all goals", icon: "coins", xpValue: 250 },
];

async function seedAchievements(userId: string) {
  await db.insert(achievementsTable).values(
    DEFAULT_ACHIEVEMENTS.map((a) => ({ ...a, userId, isUnlocked: false }))
  );
}

router.get("/achievements", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  let rows = await db.select().from(achievementsTable)
    .where(eq(achievementsTable.userId, userId))
    .orderBy(achievementsTable.id);

  if (rows.length === 0) {
    await seedAchievements(userId);
    rows = await db.select().from(achievementsTable)
      .where(eq(achievementsTable.userId, userId))
      .orderBy(achievementsTable.id);
  }

  res.json(rows.map((r) => ({ ...r, unlockedAt: r.unlockedAt ? r.unlockedAt.toISOString() : null })));
});

export default router;
