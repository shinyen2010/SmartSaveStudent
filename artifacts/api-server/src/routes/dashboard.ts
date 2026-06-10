import { Router } from "express";
import { db } from "@workspace/db";
import { expensesTable, budgetsTable, goalsTable, challengesTable, achievementsTable } from "@workspace/db";
import { eq, and, sql, desc } from "drizzle-orm";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";

const router = Router();

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

router.get("/dashboard/summary", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const month = currentMonth();

  const [{ totalSpent }] = await db
    .select({ totalSpent: sql<string>`coalesce(sum(${expensesTable.amount}), 0)` })
    .from(expensesTable)
    .where(and(eq(expensesTable.userId, userId), sql`to_char(${expensesTable.date}::date, 'YYYY-MM') = ${month}`));

  const [{ totalBudget }] = await db
    .select({ totalBudget: sql<string>`coalesce(sum(${budgetsTable.monthlyLimit}), 0)` })
    .from(budgetsTable)
    .where(and(eq(budgetsTable.userId, userId), eq(budgetsTable.month, month)));

  const [{ totalSaved }] = await db
    .select({ totalSaved: sql<string>`coalesce(sum(${goalsTable.currentAmount}), 0)` })
    .from(goalsTable)
    .where(eq(goalsTable.userId, userId));

  const [{ count }] = await db
    .select({ count: sql<string>`count(*)` })
    .from(expensesTable)
    .where(and(eq(expensesTable.userId, userId), sql`to_char(${expensesTable.date}::date, 'YYYY-MM') = ${month}`));

  const topCats = await db
    .select({ category: expensesTable.category, total: sql<string>`sum(${expensesTable.amount})` })
    .from(expensesTable)
    .where(and(eq(expensesTable.userId, userId), sql`to_char(${expensesTable.date}::date, 'YYYY-MM') = ${month}`))
    .groupBy(expensesTable.category)
    .orderBy(sql`sum(${expensesTable.amount}) desc`)
    .limit(1);

  const recentRows = await db.select().from(expensesTable)
    .where(eq(expensesTable.userId, userId))
    .orderBy(desc(expensesTable.date), desc(expensesTable.createdAt))
    .limit(5);

  const unlockedAch = await db.select().from(achievementsTable)
    .where(and(eq(achievementsTable.userId, userId), eq(achievementsTable.isUnlocked, true)));
  const xpTotal = unlockedAch.reduce((sum, a) => sum + a.xpValue, 0);
  const level = Math.floor(xpTotal / 500) + 1;

  const spent = Number(totalSpent);
  const budget = Number(totalBudget);
  const saved = Number(totalSaved);
  let healthScore = 50;
  if (budget > 0) {
    const budgetAdh = Math.max(0, 100 - ((spent / budget) * 100 - 100));
    healthScore = Math.round(Math.min(100, (budgetAdh * 0.5) + (saved > 0 ? 30 : 0) + 20));
  }

  res.json({
    totalSpentThisMonth: spent,
    totalBudget: Number(totalBudget),
    totalSaved: Number(totalSaved),
    budgetRemaining: Math.max(0, Number(totalBudget) - spent),
    expenseCount: Number(count),
    healthScore,
    xpTotal,
    level,
    topCategory: topCats[0]?.category ?? null,
    recentExpenses: recentRows.map((r) => ({ ...r, amount: Number(r.amount), createdAt: r.createdAt.toISOString() })),
  });
});

router.get("/dashboard/health-score", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const month = currentMonth();

  const [{ totalSpent }] = await db
    .select({ totalSpent: sql<string>`coalesce(sum(${expensesTable.amount}), 0)` })
    .from(expensesTable)
    .where(and(eq(expensesTable.userId, userId), sql`to_char(${expensesTable.date}::date, 'YYYY-MM') = ${month}`));

  const [{ totalBudget }] = await db
    .select({ totalBudget: sql<string>`coalesce(sum(${budgetsTable.monthlyLimit}), 0)` })
    .from(budgetsTable)
    .where(and(eq(budgetsTable.userId, userId), eq(budgetsTable.month, month)));

  const goals = await db.select().from(goalsTable).where(eq(goalsTable.userId, userId));
  const completedGoals = goals.filter((g) => g.isCompleted).length;
  const goalAchievement = goals.length > 0 ? completedGoals / goals.length : 0;

  const [{ totalSaved }] = await db
    .select({ totalSaved: sql<string>`coalesce(sum(${goalsTable.currentAmount}), 0)` })
    .from(goalsTable)
    .where(eq(goalsTable.userId, userId));

  const spent = Number(totalSpent);
  const budget = Number(totalBudget);
  const saved = Number(totalSaved);

  const budgetAdherence = budget > 0 ? Math.max(0, Math.min(100, 100 - ((spent / budget) * 100 - 100))) : 50;
  const savingsRate = budget > 0 ? Math.min(100, (saved / budget) * 100) : 0;
  const spendingConsistency = 70;
  const score = Math.round(budgetAdherence * 0.35 + savingsRate * 0.25 + goalAchievement * 100 * 0.2 + spendingConsistency * 0.2);

  let grade = "F";
  if (score >= 90) grade = "A+";
  else if (score >= 80) grade = "A";
  else if (score >= 70) grade = "B";
  else if (score >= 60) grade = "C";
  else if (score >= 50) grade = "D";

  const tips = [
    "Log expenses daily to stay on top of your spending.",
    "Try reducing your top spending category by 10% this week.",
    "Set a savings goal to make saving more motivating.",
    "Stay within your budget for 2 more weeks to boost your score.",
    "You are doing great — keep it up!",
  ];

  res.json({
    score: Math.min(100, Math.max(0, score)),
    savingsRate: Math.round(savingsRate * 10) / 10,
    budgetAdherence: Math.round(budgetAdherence * 10) / 10,
    goalAchievement: Math.round(goalAchievement * 1000) / 10,
    spendingConsistency,
    grade,
    tip: tips[Math.floor(Math.random() * tips.length)],
  });
});

router.get("/dashboard/spending-by-category", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const month = (req.query.month as string) ?? currentMonth();

  const [{ total }] = await db
    .select({ total: sql<string>`coalesce(sum(${expensesTable.amount}), 0)` })
    .from(expensesTable)
    .where(and(eq(expensesTable.userId, userId), sql`to_char(${expensesTable.date}::date, 'YYYY-MM') = ${month}`));

  const catRows = await db
    .select({ category: expensesTable.category, amount: sql<string>`sum(${expensesTable.amount})` })
    .from(expensesTable)
    .where(and(eq(expensesTable.userId, userId), sql`to_char(${expensesTable.date}::date, 'YYYY-MM') = ${month}`))
    .groupBy(expensesTable.category)
    .orderBy(sql`sum(${expensesTable.amount}) desc`);

  const budgets = await db.select().from(budgetsTable)
    .where(and(eq(budgetsTable.userId, userId), eq(budgetsTable.month, month)));

  const totalAmt = Number(total);
  const result = catRows.map((c) => {
    const amt = Number(c.amount);
    const bud = budgets.find((b) => b.category === c.category);
    const budgetAmt = bud ? Number(bud.monthlyLimit) : 0;
    return { category: c.category, amount: amt, percentage: totalAmt > 0 ? Math.round((amt / totalAmt) * 1000) / 10 : 0, budget: budgetAmt, isOverBudget: budgetAmt > 0 && amt > budgetAmt };
  });

  res.json(result);
});

router.get("/dashboard/monthly-trend", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;

  const rows = await db
    .select({ month: sql<string>`to_char(${expensesTable.date}::date, 'YYYY-MM')`, totalSpent: sql<string>`sum(${expensesTable.amount})` })
    .from(expensesTable)
    .where(eq(expensesTable.userId, userId))
    .groupBy(sql`to_char(${expensesTable.date}::date, 'YYYY-MM')`)
    .orderBy(sql`to_char(${expensesTable.date}::date, 'YYYY-MM') desc`)
    .limit(6);

  const budgetRows = await db
    .select({ month: budgetsTable.month, totalBudget: sql<string>`sum(${budgetsTable.monthlyLimit})` })
    .from(budgetsTable)
    .where(eq(budgetsTable.userId, userId))
    .groupBy(budgetsTable.month);

  const budgetMap = new Map(budgetRows.map((b) => [b.month, Number(b.totalBudget)]));
  const result = rows.reverse().map((r) => ({ month: r.month, totalSpent: Number(r.totalSpent), totalBudget: budgetMap.get(r.month) ?? 0, totalSaved: 0 }));

  res.json(result);
});

router.get("/dashboard/forecast", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const month = currentMonth();
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const dayOfMonth = today.getDate();
  const daysLeft = daysInMonth - dayOfMonth;

  const [{ totalSpent }] = await db
    .select({ totalSpent: sql<string>`coalesce(sum(${expensesTable.amount}), 0)` })
    .from(expensesTable)
    .where(and(eq(expensesTable.userId, userId), sql`to_char(${expensesTable.date}::date, 'YYYY-MM') = ${month}`));

  const [{ totalBudget }] = await db
    .select({ totalBudget: sql<string>`coalesce(sum(${budgetsTable.monthlyLimit}), 0)` })
    .from(budgetsTable)
    .where(and(eq(budgetsTable.userId, userId), eq(budgetsTable.month, month)));

  const spent = Number(totalSpent);
  const budget = Number(totalBudget);
  const dailyAverage = dayOfMonth > 0 ? spent / dayOfMonth : 0;
  const predictedMonthlySpend = spent + dailyAverage * daysLeft;
  const projectedSavings = Math.max(0, budget - predictedMonthlySpend);

  let overspendingRisk = "low";
  if (predictedMonthlySpend > budget * 1.1) overspendingRisk = "high";
  else if (predictedMonthlySpend > budget * 0.9) overspendingRisk = "medium";

  const recommendation = overspendingRisk === "high"
    ? `You are on track to overspend by RM${(predictedMonthlySpend - budget).toFixed(2)}. Consider cutting discretionary spending.`
    : overspendingRisk === "medium"
    ? "You are close to your monthly budget. Keep an eye on your spending."
    : "You are within budget — great job! Keep it up.";

  res.json({ predictedMonthlySpend: Math.round(predictedMonthlySpend * 100) / 100, currentMonthSpend: Math.round(spent * 100) / 100, daysLeft, dailyAverage: Math.round(dailyAverage * 100) / 100, projectedSavings: Math.round(projectedSavings * 100) / 100, overspendingRisk, recommendation });
});

router.get("/dashboard/alerts", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const month = currentMonth();
  const alerts: { id: string; type: string; message: string; severity: string; category: string | null }[] = [];

  const budgets = await db.select().from(budgetsTable)
    .where(and(eq(budgetsTable.userId, userId), eq(budgetsTable.month, month)));

  for (const b of budgets) {
    const [{ spent }] = await db
      .select({ spent: sql<string>`coalesce(sum(${expensesTable.amount}), 0)` })
      .from(expensesTable)
      .where(and(
        eq(expensesTable.userId, userId),
        eq(expensesTable.category, b.category),
        sql`to_char(${expensesTable.date}::date, 'YYYY-MM') = ${b.month}`
      ));
    const spentAmt = Number(spent);
    const limit = Number(b.monthlyLimit);
    const pct = limit > 0 ? spentAmt / limit : 0;

    if (pct >= 1) {
      alerts.push({ id: `budget-over-${b.id}`, type: "budget_exceeded", message: `You have exceeded your ${b.category} budget by RM${(spentAmt - limit).toFixed(2)}.`, severity: "danger", category: b.category });
    } else if (pct >= 0.8) {
      alerts.push({ id: `budget-warn-${b.id}`, type: "budget_warning", message: `You have used ${Math.round(pct * 100)}% of your ${b.category} budget.`, severity: "warning", category: b.category });
    }
  }

  res.json(alerts);
});

export default router;
