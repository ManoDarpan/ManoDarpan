import mongoose from "mongoose";

const messageSchema = mongoose.Schema({
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
    senderType: { type: String, enum: ["user", "counsellor"], required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    iv: { type: String, required: true },
    tag: { type: String, required: true },
    ciphertext: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Message", messageSchema);
