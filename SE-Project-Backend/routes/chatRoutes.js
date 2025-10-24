import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { authenticateCounsellor } from '../middleware/authCounsellor.js';
import { authenticateEither } from '../middleware/authenticateEither.js';
import { sendMessage, getMessages, acceptAndGetConversation, getUserConversations, getConversationById, getCounsellorConversations, endConversation } from '../controllers/chatController.js';

const router = express.Router();

router.post('/send', authenticateEither, sendMessage);
router.post('/send-counsellor', authenticateCounsellor, sendMessage);
router.get('/:conversationId/messages', authenticateEither , getMessages);
router.post('/conversation/accept', authenticateCounsellor, acceptAndGetConversation);
router.post('/end', authenticateEither, endConversation);
router.get('/conversations', authenticateToken, getUserConversations);
router.get('/counsellor/conversations', authenticateCounsellor, getCounsellorConversations);
router.get('/conversation/:id', authenticateEither, getConversationById);

export default router;
