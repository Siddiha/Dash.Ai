// backend/src/routes/auth.routes.ts
import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";

const router = Router();

router.post("/google", AuthController.googleAuth);
router.post("/google/callback", AuthController.googleCallback);
router.get("/me", AuthController.getMe);
router.post("/refresh", AuthController.refreshToken);
router.post("/logout", AuthController.logout);

export default router;

