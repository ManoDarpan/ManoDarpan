import mongoose from "mongoose"; // Mongoose library for MongoDB modeling

// Define the schema for a Message document
const messageSchema = mongoose.Schema({
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true }, // Reference to the conversation this message belongs to
    senderType: { type: String, enum: ["user", "counsellor"], required: true }, // Type of the sender (user or counsellor)
    senderId: { type: mongoose.Schema.Types.ObjectId, required: true }, // ID of the sender (either User or Counsellor ID)
    iv: { type: String, required: true }, // Initialization Vector (for message encryption)
    tag: { type: String, required: true }, // Authentication Tag (for GCM message encryption)
    ciphertext: { type: String, required: true }, // Encrypted message content
    createdAt: { type: Date, default: Date.now } // Timestamp of when the message was sent
});

export default mongoose.model("Message", messageSchema); // Export the Message model
