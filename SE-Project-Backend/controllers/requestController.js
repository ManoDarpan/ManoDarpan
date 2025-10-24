import Request from "../models/requestModel.js";
import Conversation from '../models/conversationModel.js';
import crypto from 'crypto';
import { wrapConversationKey } from '../utils/crypto.js';
import { getIo } from '../utils/socketManager.js';

export const createRequest = async (req, res) => {
    try {
        const { counsellorId, anonymous } = req.body;
        const now = new Date();
        const activeConv = await Conversation.findOne({ user: req.user._id, isActive: true, $or: [{ activeUntil: { $gt: now } }, { activeUntil: { $exists: false } }, { activeUntil: null }] });
        if (activeConv) {
            return res.status(400).json({ message: 'You already have an active conversation. Please finish it before sending a new request.' });
        }
        const pendingReq = await Request.findOne({ user: req.user._id, status: 'pending', expiresAt: { $gt: now } });
        if (pendingReq) {
            return res.status(400).json({ message: 'You already have a pending request. Please wait for a counsellor to accept or the request to expire.' });
        }

        const newRequest = new Request({ user: req.user._id, counsellor: counsellorId, anonymous: !!anonymous });
        await newRequest.save();
    try {
        const io = getIo();
        if (io && counsellorId) {
            const payload = { _id: newRequest._id, anonymous: !!anonymous, createdAt: newRequest.createdAt };
            if (!anonymous) payload.user = { _id: req.user._id, name: (req.user && req.user.name) || req.user.username || null };
            io.to(counsellorId.toString()).emit('newRequest', { request: payload });
        }
    } catch (e) { /* ignore */ }
    res.status(201).json({ message: "Request sent successfully", request: newRequest });
    } catch (error) {
        res.status(500).json({ message: "Error creating request", error });
    }
};

export const getUserRequests = async (req, res) => {
    try {
        const requests = await Request.find({ user: req.user._id }).populate('counsellor', 'name username');
        res.status(200).json({ requests });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user requests', error });
    }
};

export const getPendingRequests = async (req, res) => {
    try {
        const requests = await Request.find({ counsellor: req.counsellor._id, status: "pending", expiresAt: { $gt: new Date() } }).populate("user", "username email");
        const payload = requests.map(r => {
            const base = {
                _id: r._id,
                status: r.status,
                createdAt: r.createdAt,
                expiresAt: r.expiresAt,
                anonymous: !!r.anonymous
            };
            if (r.anonymous) {
                base.user = { username: 'Anonymous', email: null };
            } else if (r.user) {
                base.user = { username: r.user.username, email: r.user.email };
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

export const acceptRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await Request.findById(id);

        if (!request) return res.status(404).json({ message: "Request not found" });
        if (request.status !== "pending")
            return res.status(400).json({ message: "Request already processed" });
        if (request.expiresAt < new Date())
            return res.status(400).json({ message: "Request expired" });

        // prevent counsellor from accepting if they already have an active conversation
        const now = new Date();
        const activeConv = await Conversation.findOne({ counsellor: req.counsellor._id, isActive: true, $or: [{ activeUntil: { $gt: now } }, { activeUntil: { $exists: false } }, { activeUntil: null }] });
        if (activeConv) {
            return res.status(400).json({ message: 'You already have an active conversation. Finish it before accepting new requests.' });
        }

        request.status = "accepted";
        await request.save();

    let conversation = await Conversation.findOne({ user: request.user, counsellor: request.counsellor });
    const startedAt = new Date();
    const oneHour = 1000 * 60 * 60;

        if (conversation && !request.anonymous) {
            // reuse existing conversation only when not anonymous
            conversation.isActive = true;
            conversation.lastActivatedAt = startedAt;
            conversation.activeUntil = new Date(startedAt.getTime() + oneHour);
            await conversation.save();
        } else {
            const conversationKey = crypto.randomBytes(32);
            const encryptedKey = wrapConversationKey(conversationKey);

            conversation = new Conversation({
                user: request.user,
                counsellor: request.counsellor,
                type: "counselling",
                conversationKeyEncrypted: {
                    iv: encryptedKey.iv,
                    tag: encryptedKey.tag,
                    ciphertext: encryptedKey.ciphertext,
                },
                isActive: true,
                isAnonymous: !!request.anonymous,
                lastActivatedAt: startedAt,
                activeUntil: new Date(startedAt.getTime() + oneHour)
            });

            await conversation.save();
        }
    try {
        const io = getIo();
        if (io && request.user) io.to(request.user.toString()).emit('requestAccepted', { requestId: request._id, conversationId: conversation._id, counsellor: request.counsellor.toString(), isAnonymous: !!request.anonymous });
    } catch (e) { /* ignore */ }

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

export const rejectRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await Request.findById(id);
        if (!request) return res.status(404).json({ message: 'Request not found' });
        if (request.status !== 'pending') return res.status(400).json({ message: 'Request already processed' });
        request.status = 'expired';
        await request.save();
    try { const io = getIo(); if (io && request.user) io.to(request.user.toString()).emit('requestRejected', { requestId: request._id }); } catch (e) { /* ignore */ }
    return res.status(200).json({ message: 'Request rejected' });
    } catch (err) {
        console.error('rejectRequest error', err.message);
        return res.status(500).json({ message: 'Error rejecting request', error: err.message });
    }
};
