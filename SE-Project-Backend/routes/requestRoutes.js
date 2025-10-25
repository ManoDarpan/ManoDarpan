import express from "express"; // Import the Express framework
import { authenticateToken } from "../middleware/auth.js"; // Middleware to authenticate a regular User
import { authenticateCounsellor } from "../middleware/authCounsellor.js"; // Middleware to authenticate a Counsellor
import { createRequest, acceptRequest, getPendingRequests, getUserRequests, rejectRequest } from "../controllers/requestController.js"; // Import controller functions for request logic

const router = express.Router(); // Create a new router instance

// Define API routes for counselling request management
router.post("/create", authenticateToken, createRequest); // Route for a User to create a new counselling request
router.get('/mine', authenticateToken, getUserRequests); // Route for a User to fetch their past/pending requests
router.get("/pending", authenticateCounsellor, getPendingRequests); // Route for a Counsellor to fetch requests assigned to them
router.post("/accept/:id", authenticateCounsellor, acceptRequest); // Route for a Counsellor to accept a specific request
router.post('/reject/:id', authenticateCounsellor, rejectRequest); // Route for a Counsellor to reject a specific request

export default router; // Export the router
