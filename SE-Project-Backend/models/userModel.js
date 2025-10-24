import mongoose from 'mongoose';

const userSchema = mongoose.Schema({
    username: { type: String, required: true, unique: true},
    password: { type: String, required: true},
    email: { type: String, required: true, unique: true},
    name: { type: String, default: '' },
    profilePic: { type: String, default: '' },
    journalEntries: [{ type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' }]
});

const user = mongoose.model('User', userSchema);
export default user;
