import mongoose from "mongoose";

const counsellorSchema = new mongoose.Schema({
	name: { type: String, required: true, trim: true },
	username: { type: String, required: true, unique: true, trim: true },
	password: { type: String, required: true },
	email: { type: String, required: true, unique: true },
	areaOfExpertise: { type: String },
	yearsOfExperience: { type: Number },
	numberOfSessions: { type: Number, default: 0 },
	rating: { type: Number, default: 0 },
	profilePic: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model("Counsellor", counsellorSchema);
