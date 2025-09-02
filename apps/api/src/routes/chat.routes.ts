import { Router } from 'express';
import ChatController from '../controllers/chat.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/message', ChatController.sendMessage);
router.get('/conversations', ChatController.getConversations);
router.get('/conversations/:id', ChatController.getConversation);
router.delete('/conversations/:id', ChatController.deleteConversation);
router.get('/conversations/:id/messages', ChatController.getMessages);

export default router;