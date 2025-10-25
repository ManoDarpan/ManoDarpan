import mongoose from "mongoose"; // Mongoose library for MongoDB modeling

// Define the schema for a Conversation document
const conversationSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Reference to the User model
    counsellor: { type: mongoose.Schema.Types.ObjectId, ref: "Counsellor", required: true }, // Reference to the Counsellor model
    conversationKeyEncrypted: { // Encrypted symmetric key for message encryption
        iv: { type: String, required: true }, // Initialization Vector
        tag: { type: String, required: true }, // Authentication Tag (for GCM mode)
        ciphertext: { type: String, required: true } // Encrypted key value
    },
    isActive: { type: Boolean, default: true }, // Current active status of the conversation
    // whether this conversation was started anonymously (counsellor should not see user identity)
    isAnonymous: { type: Boolean, default: false }, // Flag for anonymous session
    lastActivatedAt: { type: Date }, // Timestamp of when the conversation was last started/re-activated
    activeUntil: { type: Date }, // Timestamp when the current active period expires
    createdAt: { type: Date, default: Date.now } // Timestamp of initial creation
});

export default mongoose.model("Conversation", conversationSchema); // Export the Conversation model
