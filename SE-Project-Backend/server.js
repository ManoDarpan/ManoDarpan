import express from 'express';
import dotenv from 'dotenv';
import connectDB from './database.js';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import userRoutes from './routes/userRoutes.js';
import counsellorRoutes from "./routes/counsellorRoutes.js";
import requestRoutes from './routes/requestRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

import Conversation from './models/conversationModel.js';
import Message from './models/messageModel.js';
import { unwrapConversationKey, aesGcmEncrypt } from './utils/crypto.js';
import { setIo } from './utils/socketManager.js';

dotenv.config();
connectDB();

const app = express();
app.use(helmet());
app.use(express.json());
app.set('trust proxy', 1);

const allowedOrigin = process.env.CLIENT_URL;
app.use(cors({
    origin: allowedOrigin,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

const Limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: {
        success: false,
        error: "Too many requests from this IP, please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.get('/', (req, res) => {
    res.status(200).json({ message: 'Backend is running smoothly!' });
});

app.head('/', (req, res) => {
    res.status(200).end();
});

app.use('/api/users', userRoutes);
app.use("/api/counsellors", counsellorRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', Limiter, adminRoutes);

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: allowedOrigin,
        methods: ["GET", "POST"]
    }
});

// expose io to controllers
setIo(io);

io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token provided"));

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.role = decoded.role || "user";
        next();
    } catch (err) {
        next(new Error("Invalid token"));
    }
});

io.on('connection', (socket) => {
    // put socket into a personal room for direct targeted emits
    try { if (socket.userId) socket.join(socket.userId.toString()); } catch (e) {}
    // if this is a counsellor, broadcast their online status
    try {
        if (socket.role === 'counsellor' && socket.userId) {
            io.emit('counsellorStatus', { id: socket.userId.toString(), status: 'online' });
        }
    } catch (e) { /* ignore */ }
    socket.on('joinConversation', async ({ conversationId }) => {
        const conv = await Conversation.findById(conversationId);
        if (!conv) return socket.emit('error', 'Conversation not found');
        if (socket.userId !== conv.user.toString() && socket.userId !== conv.counsellor.toString()) {
            return socket.emit('error', 'Unauthorized');
        }
        socket.join(conversationId);
        socket.emit('joined', { conversationId });
    });

    socket.on('sendMessage', async ({ conversationId, text }, callback) => {
        try {
            const conv = await Conversation.findById(conversationId);
            if (!conv) return callback && callback({ error: 'Conversation not found' });
            const now = new Date();
            if (conv.activeUntil && conv.activeUntil < now) {
                conv.isActive = false;
                await conv.save();
                return callback && callback({ error: 'Conversation has expired and is inactive' });
            }
            if (conv.isActive === false) {
                return callback && callback({ error: 'Conversation is inactive; sending messages is disabled' });
            }
            const convKeyBuf = unwrapConversationKey(conv.conversationKeyEncrypted);
            const encrypted = aesGcmEncrypt(Buffer.from(text, 'utf8'), convKeyBuf);
            const msg = new Message({
                conversation: conversationId,
                senderType: socket.role,
                senderId: socket.userId,
                iv: encrypted.iv,
                tag: encrypted.tag,
                ciphertext: encrypted.ciphertext
            });
            await msg.save();

            io.to(conversationId).emit('newMessage', {
                senderType: socket.role,
                senderId: socket.userId,
                text,
                createdAt: msg.createdAt
            });
            return callback && callback({ ok: true, id: msg._id });
        } catch (err) {
            console.error('Socket sendMessage error:', err.message);
            return callback && callback({ error: 'Failed to send message' });
        }
    });
    socket.on('disconnect', () => {
        try {
            if (socket.role === 'counsellor' && socket.userId) {
                io.emit('counsellorStatus', { id: socket.userId.toString(), status: 'offline' });
            }
        } catch (e) {}
    });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, error: 'Server Error' });
});

const PORT = process.env.PORT;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
