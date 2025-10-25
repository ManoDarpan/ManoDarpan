import express from 'express'; // Import the Express framework
import { authenticateToken } from '../middleware/auth.js'; // Middleware to authenticate a regular User
import { authenticateCounsellor } from '../middleware/authCounsellor.js'; // Middleware to authenticate a Counsellor
import { authenticateEither } from '../middleware/authenticateEither.js'; // Middleware to authenticate either a User or a Counsellor
import { sendMessage, getMessages, acceptAndGetConversation, getUserConversations, getConversationById, getCounsellorConversations, endConversation } from '../controllers/chatController.js'; // Import controller functions for chat logic

const router = express.Router(); // Create a new router instance

// Define API routes for chat/conversation functionality
router.post('/send', authenticateEither, sendMessage); // Route for either party (User/Counsellor) to send a message
router.post('/send-counsellor', authenticateCounsellor, sendMessage); // Alternative route for Counsellor to send a message (redundant, but kept)
router.get('/:conversationId/messages', authenticateEither , getMessages); // Route to fetch messages for a specific conversation
router.post('/conversation/accept', authenticateCounsellor, acceptAndGetConversation); // Route for a Counsellor to accept a request and start a conversation
router.post('/end', authenticateEither, endConversation); // Route for either party to end a conversation
router.get('/conversations', authenticateToken, getUserConversations); // Route for a User to fetch their conversations
router.get('/counsellor/conversations', authenticateCounsellor, getCounsellorConversations); // Route for a Counsellor to fetch their conversations
router.get('/conversation/:id', authenticateEither, getConversationById); // Route to fetch a specific conversation details

export default router; // Export the router
