import PDFDocument from "pdfkit";
import User from '../models/userModel.js';
import Counsellor from '../models/counsellorModel.js';
import Conversation from '../models/conversationModel.js';
import Request from '../models/requestModel.js';
import JournalEntry from '../models/journalEntryModel.js';
import Message from '../models/messageModel.js';

export const getAdminStats = async (req, res) => {
    const { password } = req.body;

    if (!password || password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ message: 'Unauthorized: Invalid password' });
    }

    try {
        const userCount = await User.countDocuments();
        const counsellorCount = await Counsellor.countDocuments();
        const activeConversations = await Conversation.countDocuments({ isActive: true });
        const inactiveConversations = await Conversation.countDocuments({ isActive: false });
        const requestCount = await Request.countDocuments();
        const journalEntryCount = await JournalEntry.countDocuments();
        const messageCount = await Message.countDocuments();

        res.json({
            users: userCount,
            counsellors: counsellorCount,
            conversations: {
                active: activeConversations,
                inactive: inactiveConversations,
                total: activeConversations + inactiveConversations
            },
            requests: requestCount,
            journalEntries: journalEntryCount,
            messages: messageCount
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ message: 'Server error while fetching stats' });
    }
};

export const downloadAdminStatsPDF = async (req, res) => {
    const { password } = req.body;

    if (!password || password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ message: 'Unauthorized: Invalid password' });
    }

    try {
        const userCount = await User.countDocuments();
        const counsellorCount = await Counsellor.countDocuments();
        const activeConversations = await Conversation.countDocuments({ isActive: true });
        const inactiveConversations = await Conversation.countDocuments({ isActive: false });
        const requestCount = await Request.countDocuments();
        const journalEntryCount = await JournalEntry.countDocuments();
        const messageCount = await Message.countDocuments();

        const doc = new PDFDocument();
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=admin-stats.pdf");

        doc.fontSize(20).text("Admin Platform Statistics Report", { underline: true });
        doc.moveDown();
        doc.fontSize(14).text(`Total Users: ${userCount}`);
        doc.text(`Total Counsellors: ${counsellorCount}`);
        doc.text(`Journal Entries: ${journalEntryCount}`);
        doc.text(`Messages Sent: ${messageCount}`);
        doc.text(`Requests Submitted: ${requestCount}`);
        doc.moveDown();
        doc.text(`Conversations:`);
        doc.text(`- Active: ${activeConversations}`);
        doc.text(`- Inactive: ${inactiveConversations}`);
        doc.text(`- Total: ${activeConversations + inactiveConversations}`);

        doc.end();
        doc.pipe(res);

    } catch (error) {
        console.error('PDF Error:', error);
        res.status(500).json({ message: 'Server error generating PDF' });
    }
};
