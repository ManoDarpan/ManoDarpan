import mongoose from "mongoose"; // Mongoose library for MongoDB modeling

// Define the schema for a Counsellor document
const counsellorSchema = new mongoose.Schema({
	name: { type: String, required: true, trim: true }, // Counsellor's full name
	username: { type: String, required: true, unique: true, trim: true }, // Unique login identifier
	password: { type: String, required: true }, // Hashed password
	email: { type: String, required: true, unique: true }, // Unique email address
	areaOfExpertise: { type: String }, // Specialization field
	yearsOfExperience: { type: Number }, // Counsellor's experience level in years
	numberOfSessions: { type: Number, default: 0 }, // Total sessions conducted
	rating: { type: Number, default: 0 }, // Average user rating
	profilePic: { type: String, default: '' }, // URL or path to the profile picture
}, { timestamps: true }); // Add createdAt and updatedAt fields automatically

export default mongoose.model("Counsellor", counsellorSchema); // Export the Counsellor model
