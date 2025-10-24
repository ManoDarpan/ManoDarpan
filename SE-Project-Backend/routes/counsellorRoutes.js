import express from "express";
import { authenticateCounsellor } from "../middleware/authCounsellor.js";
import { getCounsellors, googleAuthCounsellor, updateProfile, getProfile } from "../controllers/counsellorController.js";

const router = express.Router();

router.post('/google-auth', googleAuthCounsellor);
router.get('/', getCounsellors);
router.get('/profile', authenticateCounsellor, getProfile);
router.put('/profile', authenticateCounsellor, updateProfile);

export default router;
