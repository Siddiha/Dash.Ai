



// backend/src/routes/dashboard.routes.ts
import { Router } from "express";
import { DashboardController } from "../controllers/dashboard.controller";

const router = Router();

router.get("/", DashboardController.getDashboardData);
router.get("/analytics", DashboardController.getAnalytics);

export default router;