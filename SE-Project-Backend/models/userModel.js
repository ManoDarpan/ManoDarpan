import mongoose from 'mongoose'; // Mongoose library for MongoDB modeling

// Define the schema for a User document
const userSchema = mongoose.Schema({
    username: { type: String, required: true, unique: true}, // Unique login identifier
    password: { type: String, required: true}, // Hashed password
    email: { type: String, required: true, unique: true}, // Unique email address
    name: { type: String, default: '' }, // User's full name
    profilePic: { type: String, default: '' }, // URL or path to the profile picture
    journalEntries: [{ type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' }] // Array of references to the user's journal entries
});

const user = mongoose.model('User', userSchema); // Create the Mongoose model
export default user; // Export the model
