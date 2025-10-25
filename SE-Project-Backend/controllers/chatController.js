import Conversation from "../models/conversationModel.js"; // Mongoose model for conversations
import Message from "../models/messageModel.js"; // Mongoose model for messages
// Crypto utilities for key generation, wrapping/unwrapping, and AES-GCM encryption/decryption
import { randomBytes, wrapConversationKey, unwrapConversationKey, aesGcmEncrypt, aesGcmDecrypt } from "../utils/crypto.js";
import { getIo } from "../utils/socketManager.js"; // Utility to get the Socket.IO instance

// Helper function to find an existing conversation or create a new one
export const getOrCreateConversation = async (userId, counsellorId) => {
	let conv = await Conversation.findOne({ user: userId, counsellor: counsellorId });
	if (conv) return conv; // Return existing conversation

	// Generate a new 32-byte key for the conversation
	const convKey = randomBytes(32);
	// Encrypt the key using a mechanism (e.g., KEK) for secure storage
	const wrapped = wrapConversationKey(convKey);

	// Create and save a new conversation
	conv = new Conversation({
		user: userId,
		counsellor: counsellorId,
		conversationKeyEncrypted: wrapped
	});
	await conv.save();
	return conv;
};

// Controller for a counsellor to accept a request and establish/retrieve the conversation
export const acceptAndGetConversation = async (req, res) => {
	try {
		const { requestId } = req.body;
		// Use helper to get/create conversation between user and the accepting counsellor
		const conv = await getOrCreateConversation(req.body.userId, req.counsellor._id);
		res.status(200).json({ conversationId: conv._id });
	} catch (err) {
		res.status(500).json({ message: "Server error", error: err.message });
	}
};

// Controller to handle sending a new message
export const sendMessage = async (req, res) => {
	try {
		const { conversationId, plaintext } = req.body;
		if (!conversationId || !plaintext) return res.status(400).json({ message: "Missing fields" });

		const conv = await Conversation.findById(conversationId);
		if (!conv) return res.status(404).json({ message: "Conversation not found" });
		const now = new Date();
		// Check for expiration and update status if needed
		if (conv.activeUntil && conv.activeUntil < now) {
			conv.isActive = false;
			await conv.save();
			return res.status(400).json({ message: 'Conversation has expired and is inactive' });
		}

		if (conv.isActive === false) return res.status(400).json({ message: 'Conversation is inactive; sending messages is disabled' });

		// Decrypt the stored key to get the raw conversation key
		const convKeyBuf = unwrapConversationKey(conv.conversationKeyEncrypted);
		// Encrypt the message plaintext using the conversation key (AES-GCM)
		const encrypted = aesGcmEncrypt(Buffer.from(plaintext, "utf8"), convKeyBuf);

		// Create and save the encrypted message object
		const message = new Message({
			conversation: conv._id,
			senderType: req.user ? "user" : "counsellor",
			senderId: req.user ? req.user._id : req.counsellor._id,
			iv: encrypted.iv, // Initialization Vector
			tag: encrypted.tag, // Authentication Tag
			ciphertext: encrypted.ciphertext // Encrypted data
		});

		await message.save();
		// No Socket.IO emission here, assuming that's handled elsewhere or via polling
		res.status(201).json({ message: "Message sent", id: message._id });
	} catch (err) {
		res.status(500).json({ message: "Error sending message", error: err.message });
	}
};

// Controller to fetch and decrypt all messages in a conversation
export const getMessages = async (req, res) => {
	try {
		const { conversationId } = req.params;
		const conv = await Conversation.findById(conversationId);
		if (!conv) return res.status(404).json({ message: "Conversation not found" });

		// Authorization check: ensure requester is a participant
		const actorId = req.user ? req.user._id.toString() : req.counsellor._id.toString();
		if (actorId !== conv.user.toString() && actorId !== conv.counsellor.toString()) {
			return res.status(403).json({ message: "Forbidden" });
		}

		// Unwrap the conversation key
		const convKeyBuf = unwrapConversationKey(conv.conversationKeyEncrypted);

		// Fetch all encrypted messages
		const msgs = await Message.find({ conversation: conv._id }).sort({ createdAt: 1 }).lean();
		// Decrypt each message and map to a readable format
		const decrypted = msgs.map(m => {
			const plainBuf = aesGcmDecrypt({ iv: m.iv, tag: m.tag, ciphertext: m.ciphertext }, convKeyBuf);
			return {
				_id: m._id,
				conversation: m.conversation,
				senderType: m.senderType,
				senderId: m.senderId,
				text: plainBuf.toString("utf8"), // The decrypted plaintext
				createdAt: m.createdAt
			};
		});

		res.status(200).json(decrypted);
	} catch (err) {
		res.status(500).json({ message: "Error fetching messages", error: err.message });
	}
};

// Controller to get a list of conversations for a User
export const getUserConversations = async (req, res) => {
	try {
		const userId = req.user._id;
		// Find conversations and populate counsellor details
		const convs = await Conversation.find({ user: userId }).populate('counsellor', 'name username profilePic');
		const now = new Date();
		const out = [];
		// Check and update expiration status for each conversation
		for (const c of convs) {
			if (c.activeUntil && c.activeUntil < now && c.isActive) {
				c.isActive = false;
				await c.save();
			}
			// Push essential conversation details
			out.push({ _id: c._id, counsellor: c.counsellor, createdAt: c.createdAt, isActive: c.isActive, activeUntil: c.activeUntil, lastActivatedAt: c.lastActivatedAt });
		}
		res.status(200).json({ conversations: out });
	} catch (err) {
		res.status(500).json({ message: 'Error fetching conversations', error: err.message });
	}
};

// Controller to get a single conversation by ID
export const getConversationById = async (req, res) => {
	try {
		const { id } = req.params;
		// Find conversation and populate both user and counsellor details
		const conv = await Conversation.findById(id).populate('counsellor', 'name username profilePic').populate('user', 'name username profilePic');
		if (!conv) return res.status(404).json({ message: 'Conversation not found' });
		// General authorization check
		const actorId = req.user ? req.user._id : (req.counsellor ? req.counsellor._id : null);
		if (!actorId) {
			return res.status(401).json({ message: 'Unauthorized' });
		}
		// Participant check
		if (!actorId.equals(conv.user._id) && !actorId.equals(conv.counsellor._id)) {
			return res.status(403).json({ message: 'Forbidden' });
		}
		// Check and update expiration status
		const now = new Date();
		if (conv.activeUntil && conv.activeUntil < now && conv.isActive) {
			conv.isActive = false;
			await conv.save();
		}
		// Handle anonymous conversation case for the counsellor (hiding user details)
		if (conv.isAnonymous && req.counsellor && req.counsellor._id && req.counsellor._id.equals(conv.counsellor._id)) {
			return res.status(200).json({ conversation: { _id: conv._id, counsellor: conv.counsellor, user: { username: 'Anonymous' }, createdAt: conv.createdAt, isActive: conv.isActive, activeUntil: conv.activeUntil, isAnonymous: true } });
		}
	// Return full conversation details if not anonymous or if requester is the user
	res.status(200).json({ conversation: { _id: conv._id, counsellor: conv.counsellor, user: conv.user, createdAt: conv.createdAt, isActive: conv.isActive, activeUntil: conv.activeUntil, isAnonymous: !!conv.isAnonymous } });
	} catch (err) {
		res.status(500).json({ message: 'Error fetching conversation', error: err.message });
	}
};

// Controller to get a list of conversations for a Counsellor
export const getCounsellorConversations = async (req, res) => {
	try {
		const counsellorId = req.counsellor._id;
		// Find conversations and populate user details
		const convs = await Conversation.find({ counsellor: counsellorId }).populate('user', 'username profilePic');
		const now = new Date();
		const out = [];
		// Check and update expiration status for each conversation
		for (const c of convs) {
			if (c.activeUntil && c.activeUntil < now && c.isActive) {
				c.isActive = false;
				await c.save();
			}
			// Push essential conversation details
			out.push({ _id: c._id, user: c.user, createdAt: c.createdAt, isActive: c.isActive, activeUntil: c.activeUntil });
		}
		res.status(200).json({ conversations: out });
	} catch (err) {
		res.status(500).json({ message: 'Error fetching counsellor conversations', error: err.message });
	}
};

// Controller to set a conversation as inactive (ended)
export const endConversation = async (req, res) => {
	try {
		const { conversationId } = req.body;
		if (!conversationId) return res.status(400).json({ message: 'Missing conversationId' });
		const conv = await Conversation.findById(conversationId);
		if (!conv) return res.status(404).json({ message: 'Conversation not found' });
		// Authorization check: ensure requester is a participant
		const actorId = req.user ? req.user._id.toString() : req.counsellor._id.toString();
		if (actorId !== conv.user.toString() && actorId !== conv.counsellor.toString()) {
			return res.status(403).json({ message: 'Forbidden' });
		}
		// Mark conversation as inactive and clear activeUntil
		conv.isActive = false;
		conv.activeUntil = null;
		await conv.save();

		// Handle Socket.IO notification for conversation end
		try {
			const io = getIo();
			if (io) {
				const endedBy = (req.user ? 'user' : 'counsellor');
				// Determine display name for the ending party, masking user if anonymous
				let endedByName = req.user ? (req.user.name || req.user.username || 'User') : (req.counsellor ? (req.counsellor.name || req.counsellor.username || 'Counsellor') : (req.user?.username || 'User'));
				if (conv.isAnonymous && endedBy === 'user') {
					endedByName = 'Anonymous';
				}
				// Emit event to the conversation room and to individual participant rooms
				io.to(conversationId.toString()).emit('conversationEnded', { conversationId: conversationId.toString(), endedBy, endedByName });
				try { io.to(conv.user.toString()).emit('conversationEnded', { conversationId: conversationId.toString(), endedBy, endedByName }); } catch(e){} // Notify user
				try { io.to(conv.counsellor.toString()).emit('conversationEnded', { conversationId: conversationId.toString(), endedBy, endedByName }); } catch(e){} // Notify counsellor
			}
		} catch (e){} // Suppress socket error
		return res.status(200).json({ message: 'Conversation ended' });
	} catch (err) {
		console.error('endConversation error', err.message);
		return res.status(500).json({ message: 'Error ending conversation', error: err.message });
	}
};
