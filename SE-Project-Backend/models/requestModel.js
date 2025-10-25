import mongoose from "mongoose"; // Mongoose library for MongoDB modeling

// Define the schema for a Counselling Request document
const requestSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Reference to the requesting user
    counsellor: { type: mongoose.Schema.Types.ObjectId, ref: "Counsellor", required: true }, // Reference to the target counsellor
    anonymous: { type: Boolean, default: false }, // Flag if the request is anonymous
    status: { type: String, enum: ["pending", "accepted", "expired"], default: "pending" }, // Status of the request
    createdAt: { type: Date, default: Date.now }, // Timestamp of request creation
    expiresAt: { type: Date } // Timestamp when the request automatically expires
});

// Mongoose pre-save hook
requestSchema.pre("save", function (next) {
    // Automatically set expiration date (10 minutes from creation) if not already set
    if (!this.expiresAt) {
        this.expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    }
    next(); // Continue with save operation
});

const Request = mongoose.model("Request", requestSchema); // Create the Mongoose model
export default Request; // Export the model
