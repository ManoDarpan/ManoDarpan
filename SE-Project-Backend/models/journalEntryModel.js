import mongoose from "mongoose"; // Mongoose library for MongoDB modeling

// Define the schema for a Journal Entry document
const journalEntrySchema = mongoose.Schema({
    title: { type: String, required: true }, // The title of the journal entry
    content: { type: String, required: true }, // The main text content of the entry
    date: { type: Date, default: Date.now }, // Timestamp of when the entry was recorded
    sleepQuality: { type: Number, default: null }, // Self-reported sleep quality (e.g., scale of 1-5)
    moodScore: { type: Number, default: null }, // Calculated mood score (e.g., scale of 0-10)
    emotions: { type: Object, default: null } // Detailed emotion analysis data (e.g., scores for joy, sadness, etc.)
});

const JournalEntry = mongoose.model("JournalEntry", journalEntrySchema); // Create the Mongoose model
export default JournalEntry; // Export the model
