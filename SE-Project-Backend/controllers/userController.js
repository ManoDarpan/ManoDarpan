import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import User from '../models/userModel.js';
import JournalEntry from '../models/journalEntryModel.js';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const storeJournalEntry = async (req, res) => {
    const { title, content, sleepQuality } = req.body;
    try {
        const recent = await JournalEntry.findOne({ title, content }).sort({ date: -1 });
        if (recent && (Date.now() - new Date(recent.date).getTime()) < 5000) {
            if (!req.user.journalEntries.map(String).includes(String(recent._id))) {
                req.user.journalEntries.push(recent._id);
                await req.user.save();
            }
            return res.status(200).json({ message: 'Duplicate detected - returning existing entry', entry: recent });
        }

        const newEntry = new JournalEntry({
            title,
            content,
            date: new Date(),
            sleepQuality: sleepQuality != null ? Number(sleepQuality) : null,
        });

        try {
            const base = process.env.EMOTION_API_URI;
            const analysisRes = await fetch(`${base}/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: content })
            });
            if (analysisRes.ok) {
                const analysis = await analysisRes.json();
                if (analysis && analysis.emotions) {
                    const emotions = analysis.emotions;
                    const top = Object.entries(emotions).sort((a, b) => b[1] - a[1]).slice(0, 5);
                    const totalWeight = top.reduce((sum, [, v]) => sum + v, 0);
                    const bias = 0.1;

                    const polarityOf = (key) => {
                        const k = String(key).toLowerCase();
                        const positiveSeeds = [
                            'happi', 'joy', 'love', 'admire', 'optim', 'relief',
                            'excit', 'care', 'grat', 'approval', 'pride', 'amuse', 'desire'
                        ];
                        const negativeSeeds = [
                            'sad', 'anger', 'fear', 'disgust', 'guilt', 'shame',
                            'grief', 'embar', 'disappoint', 'anx', 'nerv', 'remorse'
                        ];
                        for (const s of positiveSeeds) if (k.includes(s)) return 1;
                        for (const s of negativeSeeds) if (k.includes(s)) return -1;
                        return 0;
                    };
                    let weightedPolarity = 0;
                    for (const [k, v] of top) {
                        const polarity = polarityOf(k);
                        weightedPolarity += polarity * v;
                    }
                    const normalizedPolarity = totalWeight > 0 ? weightedPolarity / totalWeight : 0;
                    const curvedPolarity = Math.tanh(normalizedPolarity * 2);
                    const moodScore = ((curvedPolarity * (1 - bias)) + bias) * 5 + 5;
                    newEntry.emotions = emotions;
                    newEntry.moodScore = Math.round(Math.min(10, Math.max(0, moodScore)) * 100) / 100;
                }
            } else {
                console.warn('Emotion API returned non-200', analysisRes.status);
            }
        } catch (analysisErr) {
            console.error('Emotion API error', analysisErr.message || analysisErr);
        }

        await newEntry.save();
        if (!req.user.journalEntries.map(String).includes(String(newEntry._id))) {
            req.user.journalEntries.push(newEntry._id);
            await req.user.save();
        }
        res.status(201).json({ message: 'Journal Entry saved successfully', entry: newEntry });
    } catch (error) {
        console.error('storeJournalEntry error', error);
        res.status(500).json({ message: 'Error saving Journal Entry', error });
    }
};

export const getJournalEntries = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate({ path: "journalEntries", model: "JournalEntry", select: "title content date sleepQuality moodScore emotions" });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const entries = (user.journalEntries || []).slice().sort((a, b) => new Date(b.date) - new Date(a.date));
        const sleeps = entries.filter(e => e.sleepQuality != null).slice(0, 7).map(e => Number(e.sleepQuality));
        const sleepAvg = sleeps.length > 0 ? (sleeps.reduce((s, v) => s + v, 0) / sleeps.length) : null;
        res.status(200).json({ journalEntries: entries, sleepAvg });
    } catch (error) {
        console.error('getJournalEntries error', error);
        res.status(500).json({ message: "Error fetching journal entries", error });
    }
};

export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user profile', error });
    }
};

export const googleAuth = async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) return res.status(400).json({ message: 'Missing idToken' });
        const ticket = await googleClient.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
        const payload = ticket.getPayload();
        const email = payload.email;
        const name = payload.name || payload.email.split('@')[0];
        const profilePic = payload.picture;

        let user = await User.findOne({ email });
        if (!user) {
            const rand = crypto.randomBytes(16).toString('hex');
            const hashed = await bcrypt.hash(rand, 10);
            user = new User({ username: email, email, password: hashed, name, profilePic });
            await user.save();
        } else {
            if ((!user.name || user.name.length === 0) && name) {
                user.name = name;
            }
            if ((!user.profilePic || user.profilePic.length === 0) && profilePic) {
                user.profilePic = profilePic;
            }
            await user.save();
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '3h' });
        res.status(200).json({ token, message: 'Authentication successful', user: { id: user._id, username: user.username, email: user.email, name: user.name, profilePic: user.profilePic } });
    } catch (err) {
        console.error('googleAuth error', err);
        res.status(401).json({ message: 'Invalid Google token', error: err.message });
    }
};

export const getLibrary = async (req, res) => {
    try {
        const resources = [
            {
                id: '1',
                title: 'Understanding Anxiety',
                imageUrl: 'https://images.unsplash.com/photo-1594122230689-45899d9e6f69?auto=format&fit=crop&q=80',
                resourceUrl: 'https://www.nimh.nih.gov/health/topics/anxiety-disorders'
            },
            {
                id: '2',
                title: 'Mindfulness Meditation Guide',
                imageUrl: 'https://images.unsplash.com/photo-1630406866478-a2fca6070d25?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1470',
                resourceUrl: 'https://www.mindful.org/how-to-meditate/'
            },
            {
                id: '3',
                title: 'Coping with Depression',
                imageUrl: 'https://images.unsplash.com/photo-1582114803437-a8fef1de0f74?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1470',
                resourceUrl: 'https://www.helpguide.org/articles/depression/coping-with-depression.htm'
            },
            {
                id: '4',
                title: 'The Importance of Sleep',
                imageUrl: 'https://images.unsplash.com/photo-1603804449568-2f36c9f12844?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8dGhlJTIwaW1wb3J0YW5jZSUyMG9mJTIwc2xlZXB8ZW58MHx8MHx8fDI%3D&auto=format&fit=crop&q=60&w=600',
                resourceUrl: 'https://www.sleepfoundation.org/how-sleep-works/why-do-we-need-sleep'
            },
            {
                id: '5',
                title: 'Mindful Eating Guide',
                imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800',
                resourceUrl: 'https://www.mindful.org/what-is-mindful-eating/'
            },
            {
                id: '6',
                title: "Beginner's Guide to Yoga",
                imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800',
                resourceUrl: 'https://isha.sadhguru.org/yoga/yoga-for-beginners/'
            },
            {
                id: '7',
                title: 'Dealing with Grief',
                imageUrl: 'https://images.unsplash.com/photo-1626783658527-d7355850e35d?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=60&w=600',
                resourceUrl: 'https://www.helpguide.org/articles/grief/coping-with-grief-and-loss.htm'
            },
            {
                id: '8',
                title: 'Building Self-Esteem',
                imageUrl: 'https://images.unsplash.com/photo-1703783413562-d2577d9c4e82?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8YnVpbGRpbmclMjBzZWxmJTIwZXN0ZWVtfGVufDB8fDB8fHwy&auto=format&fit=crop&q=60&w=600',
                resourceUrl: 'https://www.mind.org.uk/information-support/types-of-mental-health-problems/self-esteem/tips-to-improve-your-self-esteem/'
            },
            {
                id: '9',
                title: 'Managing Social Anxiety',
                imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800',
                resourceUrl: 'https://www.nhs.uk/mental-health/conditions/social-anxiety/'
            },
            {
                id: '10',
                title: 'Digital Detox Guide',
                imageUrl: 'https://images.unsplash.com/photo-1695462131582-77b777ea8ce8?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8ZGlnaXRhbCUyMGRldG94JTIwZ3VpZGV8ZW58MHx8MHx8fDI%3D&auto=format&fit=crop&q=60&w=600',
                resourceUrl: 'https://www.everydayhealth.com/emotional-health/how-to-do-a-digital-detox-without-unplugging-completely/'
            },
            {
                id: '11',
                title: 'The Power of Positive Thinking',
                imageUrl: 'https://images.unsplash.com/photo-1555880575-9d51c3e12276?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8dGhlJTIwcG93ZXIlMjBvZiUyMHBvc2l0aXZlJTIwdGhpbmtpbmd8ZW58MHx8MHx8fDI%3D&auto=format&fit=crop&q=60&w=600',
                resourceUrl: 'https://www.mayoclinic.org/healthy-lifestyle/stress-management/in-depth/positive-thinking/art-20043950'
            }
        ];

        return res.status(200).json(resources);
    } catch (err) {
        console.error('getLibrary error', err);
        return res.status(500).json({ message: 'Failed to load library resources' });
    }
};
