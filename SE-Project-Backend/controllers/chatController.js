import Conversation from "../models/conversationModel.js";
import Message from "../models/messageModel.js";
import { randomBytes, wrapConversationKey, unwrapConversationKey, aesGcmEncrypt, aesGcmDecrypt } from "../utils/crypto.js";
import { getIo } from "../utils/socketManager.js";

export const getOrCreateConversation = async (userId, counsellorId) => {
	let conv = await Conversation.findOne({ user: userId, counsellor: counsellorId });
	if (conv) return conv;

	const convKey = randomBytes(32);
	const wrapped = wrapConversationKey(convKey);

	conv = new Conversation({
		user: userId,
		counsellor: counsellorId,
		conversationKeyEncrypted: wrapped
	});
	await conv.save();
	return conv;
};

export const acceptAndGetConversation = async (req, res) => {
	try {
		const { requestId } = req.body;
		const conv = await getOrCreateConversation(req.body.userId, req.counsellor._id);
		res.status(200).json({ conversationId: conv._id });
	} catch (err) {
		res.status(500).json({ message: "Server error", error: err.message });
	}
};

export const sendMessage = async (req, res) => {
	try {
		const { conversationId, plaintext } = req.body;
		if (!conversationId || !plaintext) return res.status(400).json({ message: "Missing fields" });

		const conv = await Conversation.findById(conversationId);
		if (!conv) return res.status(404).json({ message: "Conversation not found" });
		const now = new Date();
		if (conv.activeUntil && conv.activeUntil < now) {
			conv.isActive = false;
			await conv.save();
			return res.status(400).json({ message: 'Conversation has expired and is inactive' });
		}

		if (conv.isActive === false) return res.status(400).json({ message: 'Conversation is inactive; sending messages is disabled' });

		const convKeyBuf = unwrapConversationKey(conv.conversationKeyEncrypted);
		const encrypted = aesGcmEncrypt(Buffer.from(plaintext, "utf8"), convKeyBuf);

		const message = new Message({
			conversation: conv._id,
			senderType: req.user ? "user" : "counsellor",
			senderId: req.user ? req.user._id : req.counsellor._id,
			iv: encrypted.iv,
			tag: encrypted.tag,
			ciphertext: encrypted.ciphertext
		});

		await message.save();
		res.status(201).json({ message: "Message sent", id: message._id });
	} catch (err) {
		res.status(500).json({ message: "Error sending message", error: err.message });
	}
};

export const getMessages = async (req, res) => {
	try {
		const { conversationId } = req.params;
		const conv = await Conversation.findById(conversationId);
		if (!conv) return res.status(404).json({ message: "Conversation not found" });

		const actorId = req.user ? req.user._id.toString() : req.counsellor._id.toString();
		if (actorId !== conv.user.toString() && actorId !== conv.counsellor.toString()) {
			return res.status(403).json({ message: "Forbidden" });
		}

		const convKeyBuf = unwrapConversationKey(conv.conversationKeyEncrypted);

		const msgs = await Message.find({ conversation: conv._id }).sort({ createdAt: 1 }).lean();
		const decrypted = msgs.map(m => {
			const plainBuf = aesGcmDecrypt({ iv: m.iv, tag: m.tag, ciphertext: m.ciphertext }, convKeyBuf);
			return {
				_id: m._id,
				conversation: m.conversation,
				senderType: m.senderType,
				senderId: m.senderId,
				text: plainBuf.toString("utf8"),
				createdAt: m.createdAt
			};
		});

		res.status(200).json(decrypted);
	} catch (err) {
		res.status(500).json({ message: "Error fetching messages", error: err.message });
	}
};

export const getUserConversations = async (req, res) => {
	try {
		const userId = req.user._id;
		const convs = await Conversation.find({ user: userId }).populate('counsellor', 'name username profilePic');
		const now = new Date();
		const out = [];
		for (const c of convs) {
			if (c.activeUntil && c.activeUntil < now && c.isActive) {
				c.isActive = false;
				await c.save();
			}
			out.push({ _id: c._id, counsellor: c.counsellor, createdAt: c.createdAt, isActive: c.isActive, activeUntil: c.activeUntil, lastActivatedAt: c.lastActivatedAt });
		}
		res.status(200).json({ conversations: out });
	} catch (err) {
		res.status(500).json({ message: 'Error fetching conversations', error: err.message });
	}
};

export const getConversationById = async (req, res) => {
	try {
		const { id } = req.params;
		const conv = await Conversation.findById(id).populate('counsellor', 'name username profilePic').populate('user', 'username profilePic');
		if (!conv) return res.status(404).json({ message: 'Conversation not found' });
		const actorId = req.user ? req.user._id : (req.counsellor ? req.counsellor._id : null);
		if (!actorId) {
			return res.status(401).json({ message: 'Unauthorized' });
		}
		if (!actorId.equals(conv.user._id) && !actorId.equals(conv.counsellor._id)) {
			return res.status(403).json({ message: 'Forbidden' });
		}
		const now = new Date();
		if (conv.activeUntil && conv.activeUntil < now && conv.isActive) {
			conv.isActive = false;
			await conv.save();
		}
		// If conversation is anonymous and the requester is the counsellor, hide user identity and messages
		if (conv.isAnonymous && req.counsellor && req.counsellor._id && req.counsellor._id.equals(conv.counsellor._id)) {
			return res.status(200).json({ conversation: { _id: conv._id, counsellor: conv.counsellor, user: { username: 'Anonymous' }, createdAt: conv.createdAt, isActive: conv.isActive, activeUntil: conv.activeUntil, isAnonymous: true } });
		}
	res.status(200).json({ conversation: { _id: conv._id, counsellor: conv.counsellor, user: conv.user, createdAt: conv.createdAt, isActive: conv.isActive, activeUntil: conv.activeUntil, isAnonymous: !!conv.isAnonymous } });
	} catch (err) {
		res.status(500).json({ message: 'Error fetching conversation', error: err.message });
	}
};

export const getCounsellorConversations = async (req, res) => {
	try {
		const counsellorId = req.counsellor._id;
		const convs = await Conversation.find({ counsellor: counsellorId }).populate('user', 'username profilePic');
		const now = new Date();
		const out = [];
		for (const c of convs) {
			if (c.activeUntil && c.activeUntil < now && c.isActive) {
				c.isActive = false;
				await c.save();
			}
			out.push({ _id: c._id, user: c.user, createdAt: c.createdAt, isActive: c.isActive, activeUntil: c.activeUntil });
		}
		res.status(200).json({ conversations: out });
	} catch (err) {
		res.status(500).json({ message: 'Error fetching counsellor conversations', error: err.message });
	}
};

export const endConversation = async (req, res) => {
	try {
		const { conversationId } = req.body;
		if (!conversationId) return res.status(400).json({ message: 'Missing conversationId' });
		const conv = await Conversation.findById(conversationId);
		if (!conv) return res.status(404).json({ message: 'Conversation not found' });
		const actorId = req.user ? req.user._id.toString() : req.counsellor._id.toString();
		if (actorId !== conv.user.toString() && actorId !== conv.counsellor.toString()) {
			return res.status(403).json({ message: 'Forbidden' });
		}
		conv.isActive = false;
		conv.activeUntil = null;
		await conv.save();

		try {
			const io = getIo();
			if (io) {
				// indicate who ended it
				const endedBy = (req.user ? 'user' : 'counsellor');
				// If conversation is anonymous and a user ended it, mask the name
				let endedByName = req.user ? (req.user.name || req.user.username || 'User') : (req.counsellor ? (req.counsellor.name || req.counsellor.username || 'Counsellor') : (req.user?.username || 'User'));
				if (conv.isAnonymous && endedBy === 'user') {
					endedByName = 'Anonymous';
				}
				// notify all sockets in the conversation room with actor info and display name
				io.to(conversationId.toString()).emit('conversationEnded', { conversationId: conversationId.toString(), endedBy, endedByName });
				// also notify both participants in case they are not joined to the room
				try { io.to(conv.user.toString()).emit('conversationEnded', { conversationId: conversationId.toString(), endedBy, endedByName }); } catch(e){}
				try { io.to(conv.counsellor.toString()).emit('conversationEnded', { conversationId: conversationId.toString(), endedBy, endedByName }); } catch(e){}
			}
		} catch (e){}
		return res.status(200).json({ message: 'Conversation ended' });
	} catch (err) {
		console.error('endConversation error', err.message);
		return res.status(500).json({ message: 'Error ending conversation', error: err.message });
	}
};
