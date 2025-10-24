import express from 'express';
import { storeJournalEntry, getJournalEntries, googleAuth, getUserProfile } from '../controllers/userController.js';
import { getLibrary } from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/profile', authenticateToken, getUserProfile);
router.post('/google-auth', googleAuth);
router.post('/journal', authenticateToken, storeJournalEntry);
router.get('/journals', authenticateToken, getJournalEntries);
router.get('/library', getLibrary);

export default router;
