// backend/src/routes/chat.routes.ts
import { Router } from "express";
import { ChatController } from "../controllers/chat.controller";

const router = Router();

router.post("/message", ChatController.sendMessage);
router.get("/sessions", ChatController.getChatSessions);
router.get("/sessions/:sessionId", ChatController.getChatHistory);
router.delete("/sessions/:sessionId", ChatController.deleteChatSession);

export default router;


