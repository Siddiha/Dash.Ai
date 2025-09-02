import { Router } from "express";
import IntegrationController from "../controllers/integration.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authMiddleware, IntegrationController.getIntegrations);
router.post("/connect", authMiddleware, IntegrationController.connect);
router.delete("/:type", authMiddleware, IntegrationController.disconnect);
router.post("/refresh/:type", authMiddleware, IntegrationController.refresh);
router.get("/test/:type", authMiddleware, IntegrationController.test);

// OAuth
router.get("/oauth/google", authMiddleware, IntegrationController.googleOAuth);
router.get("/oauth/google/callback", IntegrationController.googleOAuthCallback);
router.get("/oauth/slack", authMiddleware, IntegrationController.slackOAuth);
router.get("/oauth/slack/callback", IntegrationController.slackOAuthCallback);

export default router;

import { Router } from "express";
import IntegrationController from "../controllers/integration.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", IntegrationController.getIntegrations);
router.post("/connect", IntegrationController.connect);
router.delete("/:type", IntegrationController.disconnect);
router.put("/:type/refresh", IntegrationController.refresh);
router.get("/:type/test", IntegrationController.test);

// OAuth callbacks
router.get("/oauth/google", IntegrationController.googleOAuth);
router.get("/oauth/google/callback", IntegrationController.googleOAuthCallback);
router.get("/oauth/slack", IntegrationController.slackOAuth);
router.get("/oauth/slack/callback", IntegrationController.slackOAuthCallback);

export default router;
