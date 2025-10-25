import PDFDocument from "pdfkit"; // Library for creating PDF documents
import User from '../models/userModel.js'; // Mongoose model for User
import Counsellor from '../models/counsellorModel.js'; // Mongoose model for Counsellor
import Conversation from '../models/conversationModel.js'; // Mongoose model for Conversation
import Request from '../models/requestModel.js'; // Mongoose model for Request (e.g., counselling request)
import JournalEntry from '../models/journalEntryModel.js'; // Mongoose model for JournalEntry
import Message from '../models/messageModel.js'; // Mongoose model for Message

// Controller to fetch and return high-level application statistics
export const getAdminStats = async (req, res) => {
    const { password } = req.body;

    // Basic authorization check against environment variable
    if (!password || password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ message: 'Unauthorized: Invalid password' });
    }

    try {
        // Fetch counts for various database collections
        const userCount = await User.countDocuments();
        const counsellorCount = await Counsellor.countDocuments();
        const activeConversations = await Conversation.countDocuments({ isActive: true });
        const inactiveConversations = await Conversation.countDocuments({ isActive: false });
        const requestCount = await Request.countDocuments();
        const journalEntryCount = await JournalEntry.countDocuments();
        const messageCount = await Message.countDocuments();

        // Send structured JSON response with all stats
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

// Controller to generate and download the stats as a PDF report
export const downloadAdminStatsPDF = async (req, res) => {
    const { password } = req.body;

    // Authorization check
    if (!password || password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ message: 'Unauthorized: Invalid password' });
    }

    try {
        // Fetch all statistics data (same as getAdminStats)
        const userCount = await User.countDocuments();
        const counsellorCount = await Counsellor.countDocuments();
        const activeConversations = await Conversation.countDocuments({ isActive: true });
        const inactiveConversations = await Conversation.countDocuments({ isActive: false });
        const requestCount = await Request.countDocuments();
        const journalEntryCount = await JournalEntry.countDocuments();
        const messageCount = await Message.countDocuments();

        // Initialize PDF document
        const doc = new PDFDocument();
        // Set response headers for PDF download
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=admin-stats.pdf");

        // Write content to the PDF
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

        doc.end(); // Finalize PDF
        doc.pipe(res); // Stream PDF to the response
    } catch (error) {
        console.error('PDF Error:', error);
        res.status(500).json({ message: 'Server error generating PDF' });
    }
};
