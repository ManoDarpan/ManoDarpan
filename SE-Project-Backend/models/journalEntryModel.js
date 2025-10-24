import mongoose from "mongoose";

const journalEntrySchema = mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    date: { type: Date, default: Date.now },
    sleepQuality: { type: Number, default: null },
    moodScore: { type: Number, default: null },
    emotions: { type: Object, default: null }
});

const JournalEntry = mongoose.model("JournalEntry", journalEntrySchema);
export default JournalEntry;
