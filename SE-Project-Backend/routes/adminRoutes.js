import express from 'express'; // Import the Express framework
import { getAdminStats, downloadAdminStatsPDF } from '../controllers/adminController.js'; // Import controller functions for admin logic

const router = express.Router(); // Create a new router instance

// Define API routes for admin functionality
router.post('/stats', getAdminStats); // Route to get aggregated statistics (e.g., POST as it may involve a date range)
router.post('/stats/pdf', downloadAdminStatsPDF); // Route to generate and download a PDF of the statistics

export default router; // Export the router
