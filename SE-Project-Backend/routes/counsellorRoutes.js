import express from "express"; // Import the Express framework
import { authenticateCounsellor } from "../middleware/authCounsellor.js"; // Middleware to ensure the user is an authenticated counsellor
import { getCounsellors, googleAuthCounsellor, updateProfile, getProfile } from "../controllers/counsellorController.js"; // Import controller functions for counsellor logic

const router = express.Router(); // Create a new router instance

// Define API routes for counsellor management and authentication
router.post('/google-auth', googleAuthCounsellor); // Route for Google Sign-In/Auth for counsellors
router.get('/', getCounsellors); // Route to fetch a list of all counsellors
router.get('/profile', authenticateCounsellor, getProfile); // Route to get the authenticated counsellor's profile
router.put('/profile', authenticateCounsellor, updateProfile); // Route to update the authenticated counsellor's profile

export default router; // Export the router
