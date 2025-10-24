import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { authenticateCounsellor } from "../middleware/authCounsellor.js";
import { createRequest, acceptRequest, getPendingRequests, getUserRequests, rejectRequest } from "../controllers/requestController.js";

const router = express.Router();

router.post("/create", authenticateToken, createRequest);
router.get('/mine', authenticateToken, getUserRequests);
router.get("/pending", authenticateCounsellor, getPendingRequests);
router.post("/accept/:id", authenticateCounsellor, acceptRequest);
router.post('/reject/:id', authenticateCounsellor, rejectRequest);

export default router;
