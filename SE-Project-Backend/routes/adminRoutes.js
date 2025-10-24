import express from 'express';
import { getAdminStats, downloadAdminStatsPDF } from '../controllers/adminController.js';

const router = express.Router();

router.post('/stats', getAdminStats);
router.post('/stats/pdf', downloadAdminStatsPDF);

export default router;