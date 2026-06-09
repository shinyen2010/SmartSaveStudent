import { Router, type IRouter } from "express";
import healthRouter from "./health";
import expensesRouter from "./expenses";
import budgetsRouter from "./budgets";
import goalsRouter from "./goals";
import challengesRouter from "./challenges";
import achievementsRouter from "./achievements";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(expensesRouter);
router.use(budgetsRouter);
router.use(goalsRouter);
router.use(challengesRouter);
router.use(achievementsRouter);
router.use(dashboardRouter);

export default router;
