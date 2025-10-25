import express from 'express'; // Import the Express framework
import { storeJournalEntry, getJournalEntries, googleAuth, getUserProfile } from '../controllers/userController.js'; // Import user-specific controller functions
import { getLibrary } from '../controllers/userController.js'; // Import library function (also from user controller)
import { authenticateToken } from '../middleware/auth.js'; // Middleware to authenticate a regular User

const router = express.Router(); // Create a new router instance

// Define API routes for user functionality
router.get('/profile', authenticateToken, getUserProfile); // Route to get the authenticated user's profile
router.post('/google-auth', googleAuth); // Route for Google Sign-In/Auth
router.post('/journal', authenticateToken, storeJournalEntry); // Route to save a new journal entry
router.get('/journals', authenticateToken, getJournalEntries); // Route to fetch all journal entries for the user
router.get('/library', getLibrary); // Route to fetch mental health library resources (no auth needed)

export default router; // Export the router
