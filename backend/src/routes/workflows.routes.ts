
// backend/src/routes/workflows.routes.ts
import { Router } from "express";
import { WorkflowController } from "../controllers/workflow.controller";

const router = Router();

router.get("/", WorkflowController.getUserWorkflows);
router.post("/", WorkflowController.createWorkflow);
router.get("/:id", WorkflowController.getWorkflow);
router.patch("/:id", WorkflowController.updateWorkflow);
router.delete("/:id", WorkflowController.deleteWorkflow);
router.post("/:id/execute", WorkflowController.executeWorkflow);
router.get("/:id/executions", WorkflowController.getWorkflowExecutions);

export default router;



