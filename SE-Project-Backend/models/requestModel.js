import mongoose from "mongoose";

const requestSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    counsellor: { type: mongoose.Schema.Types.ObjectId, ref: "Counsellor", required: true },
    anonymous: { type: Boolean, default: false },
    status: { type: String, enum: ["pending", "accepted", "expired"], default: "pending" },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date }
});

requestSchema.pre("save", function (next) {
    if (!this.expiresAt) {
        this.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    }
    next();
});

const Request = mongoose.model("Request", requestSchema);
export default Request;
