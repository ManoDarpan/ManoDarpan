import express from 'express'; // Web framework for Node.js
import dotenv from 'dotenv'; // Load environment variables from .env file
import connectDB from './database.js'; // Function to connect to MongoDB
import cors from 'cors'; // Middleware for Cross-Origin Resource Sharing
import http from 'http'; // Node's built-in HTTP module
import { Server } from 'socket.io'; // Socket.io server for real-time communication
import jwt from 'jsonwebtoken'; // Library for JSON Web Tokens
import helmet from 'helmet'; // Security middleware for various HTTP headers
import rateLimit from 'express-rate-limit'; // Middleware for limiting repeated requests

// Import routes
import userRoutes from './routes/userRoutes.js';
import counsellorRoutes from "./routes/counsellorRoutes.js";
import requestRoutes from './routes/requestRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// Import models and utilities
import Conversation from './models/conversationModel.js';
import Message from './models/messageModel.js';
import { unwrapConversationKey, aesGcmEncrypt } from './utils/crypto.js'; // Encryption/decryption utilities
import { setIo } from './utils/socketManager.js'; // Utility to expose io instance to controllers

dotenv.config(); // Load environment variables
connectDB(); // Connect to the database

const app = express(); // Initialize Express application
app.use(helmet()); // Use Helmet for security headers
app.use(express.json()); // Body parser for JSON payloads
app.set('trust proxy', 1); // Trust first proxy (needed for rate limiting behind a proxy like Heroku/Nginx)

const allowedOrigin = process.env.CLIENT_URL; // Whitelisted client URL for CORS
app.use(cors({ // Configure CORS
    origin: allowedOrigin,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

// API Rate Limiter configuration
const Limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // Limit each IP to 30 requests per windowMs
    message: {
        success: false,
        error: "Too many requests from this IP, please try again later."
    },
    standardHeaders: true, // Return rate limit info in the headers
    legacyHeaders: false, // Disable X-Rate-Limit-* headers
});

// Basic health check routes
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Backend is running smoothly!' });
});

app.head('/', (req, res) => {
    res.status(200).end();
});

// Use API routes
app.use('/api/users', userRoutes);
app.use("/api/counsellors", counsellorRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/chat', chatRoutes);
// Apply rate limit specifically to admin routes for security
app.use('/api/admin', Limiter, adminRoutes);

const server = http.createServer(app); // Create HTTP server from Express app
const io = new Server(server, { // Initialize Socket.io server
    cors: {
        origin: allowedOrigin, // Configure CORS for Socket.io
        methods: ["GET", "POST"]
    }
});

// expose io to controllers
setIo(io); // Make the socket.io instance globally available to controllers

// Socket.io JWT authentication middleware
io.use((socket, next) => {
    const token = socket.handshake.auth?.token; // Get token from handshake
    if (!token) return next(new Error("No token provided"));

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token
        socket.userId = decoded.id; // Attach user ID
        socket.role = decoded.role || "user"; // Attach user role
        next(); // Continue connection
    } catch (err) {
        next(new Error("Invalid token")); // Reject connection on invalid token
    }
});

// Socket.io connection handling
io.on('connection', (socket) => {
    // put socket into a personal room for direct targeted emits
    try { if (socket.userId) socket.join(socket.userId.toString()); } catch (e) {} // Join personal room

    // Counsellor online status broadcast
    try {
        if (socket.role === 'counsellor' && socket.userId) {
            io.emit('counsellorStatus', { id: socket.userId.toString(), status: 'online' }); // Broadcast online status
        }
    } catch (e) { /* ignore */ }

    // Handler for joining a specific conversation room
    socket.on('joinConversation', async ({ conversationId }) => {
        const conv = await Conversation.findById(conversationId);
        if (!conv) return socket.emit('error', 'Conversation not found');
        // Authorization check
        if (socket.userId !== conv.user.toString() && socket.userId !== conv.counsellor.toString()) {
            return socket.emit('error', 'Unauthorized');
        }
        socket.join(conversationId); // Join the conversation room
        socket.emit('joined', { conversationId });
    });

    // Handler for sending a new message
    socket.on('sendMessage', async ({ conversationId, text }, callback) => {
        try {
            const conv = await Conversation.findById(conversationId);
            if (!conv) return callback && callback({ error: 'Conversation not found' });
            const now = new Date();
            // Check for expiration and inactivity
            if (conv.activeUntil && conv.activeUntil < now) {
                conv.isActive = false;
                await conv.save();
                return callback && callback({ error: 'Conversation has expired and is inactive' });
            }
            if (conv.isActive === false) {
                return callback && callback({ error: 'Conversation is inactive; sending messages is disabled' });
            }
            // Decrypt conversation key using master key
            const convKeyBuf = unwrapConversationKey(conv.conversationKeyEncrypted);
            // Encrypt message content using the conversation key
            const encrypted = aesGcmEncrypt(Buffer.from(text, 'utf8'), convKeyBuf);
            
            // Create and save the new encrypted message document
            const msg = new Message({
                conversation: conversationId,
                senderType: socket.role,
                senderId: socket.userId,
                iv: encrypted.iv,
                tag: encrypted.tag,
                ciphertext: encrypted.ciphertext
            });
            await msg.save();

            // Emit the unencrypted message to the conversation room for real-time display
            io.to(conversationId).emit('newMessage', {
                senderType: socket.role,
                senderId: socket.userId,
                text, // NOTE: The text here is NOT the encrypted one for quick delivery
                createdAt: msg.createdAt
            });
            return callback && callback({ ok: true, id: msg._id });
        } catch (err) {
            console.error('Socket sendMessage error:', err.message);
            return callback && callback({ error: 'Failed to send message' });
        }
    });

    // Handle socket disconnection
    socket.on('disconnect', () => {
        try {
            // Counsellor offline status broadcast
            if (socket.role === 'counsellor' && socket.userId) {
                io.emit('counsellorStatus', { id: socket.userId.toString(), status: 'offline' });
            }
        } catch (e) {}
    });
});

// Global Error Handler middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, error: 'Server Error' });
});

const PORT = process.env.PORT;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`)); // Start the server
