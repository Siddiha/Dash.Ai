import { Router } from "express";
import WorkflowController from "../controllers/workflow.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authMiddleware, WorkflowController.getWorkflows);
router.post("/", authMiddleware, WorkflowController.createWorkflow);
router.get("/:id", authMiddleware, WorkflowController.getWorkflow);
router.patch("/:id", authMiddleware, WorkflowController.updateWorkflow);
router.delete("/:id", authMiddleware, WorkflowController.deleteWorkflow);
router.post("/:id/execute", authMiddleware, WorkflowController.executeWorkflow);
router.get("/:id/executions", authMiddleware, WorkflowController.getExecutions);
router.post("/:id/toggle", authMiddleware, WorkflowController.toggleWorkflow);

export default router;

import { Router } from "express";
import WorkflowController from "../controllers/workflow.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", WorkflowController.getWorkflows);
router.post("/", WorkflowController.createWorkflow);
router.get("/:id", WorkflowController.getWorkflow);
router.put("/:id", WorkflowController.updateWorkflow);
router.delete("/:id", WorkflowController.deleteWorkflow);
router.post("/:id/execute", WorkflowController.executeWorkflow);
router.get("/:id/executions", WorkflowController.getExecutions);
router.post("/:id/toggle", WorkflowController.toggleWorkflow);

export default router;
