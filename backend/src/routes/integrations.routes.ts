// backend/src/routes/integrations.routes.ts
import { Router } from "express";
import { IntegrationController } from "../controllers/integrations.controller";

const router = Router();

router.get("/", IntegrationController.getUserIntegrations);
router.post("/:type/connect", IntegrationController.connectIntegration);
router.delete("/:id", IntegrationController.disconnectIntegration);
router.post("/:id/sync", IntegrationController.syncIntegration);
router.get("/:id/data", IntegrationController.getIntegrationData);

export default router;

