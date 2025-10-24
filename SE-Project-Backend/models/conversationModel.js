import mongoose from "mongoose";

const conversationSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    counsellor: { type: mongoose.Schema.Types.ObjectId, ref: "Counsellor", required: true },
    conversationKeyEncrypted: {
        iv: { type: String, required: true },
        tag: { type: String, required: true },
        ciphertext: { type: String, required: true }
    },
    isActive: { type: Boolean, default: true },
    // whether this conversation was started anonymously (counsellor should not see user identity)
    isAnonymous: { type: Boolean, default: false },
    lastActivatedAt: { type: Date },
    activeUntil: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Conversation", conversationSchema);
