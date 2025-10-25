import Request from "../models/requestModel.js"; // Mongoose model for counselling requests
import Conversation from '../models/conversationModel.js'; // Mongoose model for conversations
import crypto from 'crypto'; // Node.js built-in crypto module for key generation
import { wrapConversationKey } from '../utils/crypto.js'; // Utility for encrypting the conversation key
import { getIo } from '../utils/socketManager.js'; // Utility to get the Socket.IO instance

// Controller to create a new counselling request
export const createRequest = async (req, res) => {
    try {
        const { counsellorId, anonymous } = req.body;
        const now = new Date();
        // Check for an existing active conversation for the user
        const activeConv = await Conversation.findOne({ user: req.user._id, isActive: true, $or: [{ activeUntil: { $gt: now } }, { activeUntil: { $exists: false } }, { activeUntil: null }] });
        if (activeConv) {
            return res.status(400).json({ message: 'You already have an active conversation. Please finish it before sending a new request.' });
        }
        // Check for an existing pending request that hasn't expired
        const pendingReq = await Request.findOne({ user: req.user._id, status: 'pending', expiresAt: { $gt: now } });
        if (pendingReq) {
            return res.status(400).json({ message: 'You already have a pending request. Please wait for a counsellor to accept or the request to expire.' });
        }

        // Create and save the new request
        const newRequest = new Request({ user: req.user._id, counsellor: counsellorId, anonymous: !!anonymous });
        await newRequest.save();
    // Notify the specific counsellor via Socket.IO
    try {
        const io = getIo();
        if (io && counsellorId) {
            const payload = { _id: newRequest._id, anonymous: !!anonymous, createdAt: newRequest.createdAt };
            // Only include user details if the request is not anonymous
            if (!anonymous) payload.user = { _id: req.user._id, name: (req.user && req.user.name) || req.user.username || null, profilePic: (req.user && req.user.profilePic) || null };
            io.to(counsellorId.toString()).emit('newRequest', { request: payload });
        }
    } catch (e) { /* ignore socket error */ }
    res.status(201).json({ message: "Request sent successfully", request: newRequest });
    } catch (error) {
        res.status(500).json({ message: "Error creating request", error });
    }
};

// Controller to fetch all requests made by the current user
export const getUserRequests = async (req, res) => {
    try {
        // Find requests by user ID and populate counsellor details
        const requests = await Request.find({ user: req.user._id }).populate('counsellor', 'name username');
        res.status(200).json({ requests });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user requests', error });
    }
};

// Controller to fetch pending requests for the current counsellor
export const getPendingRequests = async (req, res) => {
    try {
    // Find pending requests assigned to the counsellor that haven't expired, populate user details
    const requests = await Request.find({ counsellor: req.counsellor._id, status: "pending", expiresAt: { $gt: new Date() } }).populate("user", "name username email profilePic");
        // Map requests, masking user info if the request is anonymous
        const payload = requests.map(r => {
            const base = {
                _id: r._id,
                status: r.status,
                createdAt: r.createdAt,
                expiresAt: r.expiresAt,
                anonymous: !!r.anonymous
            };
            if (r.anonymous) {
                base.user = { username: 'Anonymous', email: null }; // Mask info
            } else if (r.user) {
                base.user = { name: r.user.name, username: r.user.username, email: r.user.email, profilePic: r.user.profilePic || null }; // Include info
            } else {
                base.user = null;
            }
            return base;
        });
        res.status(200).json({ requests: payload });
    } catch (error) {
        res.status(500).json({ message: "Error fetching requests", error });
    }
};

// Controller for a counsellor to accept a pending request
export const acceptRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await Request.findById(id);

        // Validation checks
        if (!request) return res.status(404).json({ message: "Request not found" });
        if (request.status !== "pending")
            return res.status(400).json({ message: "Request already processed" });
        if (request.expiresAt < new Date())
            return res.status(400).json({ message: "Request expired" });

        // Prevent counsellor from accepting if they already have an active conversation
        const now = new Date();
        const activeConv = await Conversation.findOne({ counsellor: req.counsellor._id, isActive: true, $or: [{ activeUntil: { $gt: now } }, { activeUntil: { $exists: false } }, { activeUntil: null }] });
        if (activeConv) {
            return res.status(400).json({ message: 'You already have an active conversation. Finish it before accepting new requests.' });
        }

        request.status = "accepted"; // Update request status
        await request.save();

    // Find existing conversation
    let conversation = await Conversation.findOne({ user: request.user, counsellor: request.counsellor });
    const startedAt = new Date();
    const oneHour = 1000 * 60 * 60;

        if (conversation && !request.anonymous) {
            // Reuse existing non-anonymous conversation
            conversation.isActive = true;
            conversation.lastActivatedAt = startedAt;
            conversation.activeUntil = new Date(startedAt.getTime() + oneHour); // Set new expiration
            await conversation.save();
        } else {
            // Create a brand new conversation (always for anonymous, or if none exists)
            const conversationKey = crypto.randomBytes(32); // Generate new key
            const encryptedKey = wrapConversationKey(conversationKey); // Wrap the key

            conversation = new Conversation({
                user: request.user,
                counsellor: request.counsellor,
                type: "counselling",
                conversationKeyEncrypted: { // Store wrapped key details
                    iv: encryptedKey.iv,
                    tag: encryptedKey.tag,
                    ciphertext: encryptedKey.ciphertext,
                },
                isActive: true,
                isAnonymous: !!request.anonymous, // Set anonymity flag
                lastActivatedAt: startedAt,
                activeUntil: new Date(startedAt.getTime() + oneHour) // Set expiration
            });

            await conversation.save();
        }
    // Notify the user via Socket.IO that their request was accepted
    try {
        const io = getIo();
        if (io && request.user) io.to(request.user.toString()).emit('requestAccepted', { requestId: request._id, conversationId: conversation._id, counsellor: request.counsellor.toString(), isAnonymous: !!request.anonymous });
    } catch (e) { /* ignore socket error */ }

        res.status(200).json({
            message: "Request accepted and conversation prepared successfully",
            request,
            conversationId: conversation._id
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error accepting request", error });
    }
};

// Controller for a counsellor to reject a pending request
export const rejectRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await Request.findById(id);
        if (!request) return res.status(404).json({ message: 'Request not found' });
        if (request.status !== 'pending') return res.status(400).json({ message: 'Request already processed' });
        request.status = 'expired'; // Set status to expired/rejected
        await request.save();
    // Notify the user via Socket.IO that their request was rejected
    try { const io = getIo(); if (io && request.user) io.to(request.user.toString()).emit('requestRejected', { requestId: request._id }); } catch (e) { /* ignore socket error */ }
    return res.status(200).json({ message: 'Request rejected' });
    } catch (err) {
        console.error('rejectRequest error', err.message);
        return res.status(500).json({ message: 'Error rejecting request', error: err.message });
    }
};
