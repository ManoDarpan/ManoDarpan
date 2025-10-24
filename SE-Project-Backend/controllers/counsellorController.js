import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from 'crypto';
import Counsellor from "../models/counsellorModel.js";
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const getCounsellors = async (req, res) => {
    try {
        const counsellors = await Counsellor.find({}, 'name username areaOfExpertise').limit(10);
        res.status(200).json({ counsellors });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching counsellors', error: error.message });
    }
};

export const googleAuthCounsellor = async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) return res.status(400).json({ message: 'Missing idToken' });
        const ticket = await googleClient.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
        const payload = ticket.getPayload();
        const email = payload.email;
        const name = payload.name || payload.email.split('@')[0];

        let c = await Counsellor.findOne({ email });
        if (!c) {
            const rand = crypto.randomBytes(16).toString('hex');
            const hashed = await bcrypt.hash(rand, 10);
            c = new Counsellor({ name, username: email, email, password: hashed, areaOfExpertise: 'General', yearsOfExperience: 0 });
            await c.save();
        }
        const token = jwt.sign({ id: c._id, role: 'counsellor' }, process.env.JWT_SECRET, { expiresIn: '3h' });
        res.status(200).json({ token, message: 'Authentication successful', counsellor: { id: c._id, name: c.name, username: c.username } });
    } catch (err) {
        console.error('googleAuthCounsellor error', err);
        res.status(401).json({ message: 'Invalid Google token', error: err.message });
    }
};

export const getProfile = async (req, res) => {
  try {
    const counsellor = await Counsellor.findById(req.counsellor._id).select('-password');
    if (!counsellor) {
      return res.status(404).json({ message: 'Counsellor not found' });
    }
    res.status(200).json({ counsellor });
  } catch (err) {
    console.error('Error fetching counsellor profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { areaOfExpertise, yearsOfExperience } = req.body;

    const counsellor = await Counsellor.findById(req.counsellor._id);
    if (!counsellor) {
      return res.status(404).json({ message: 'Counsellor not found' });
    }

    if (areaOfExpertise) counsellor.areaOfExpertise = areaOfExpertise;
    if (yearsOfExperience !== undefined) counsellor.yearsOfExperience = yearsOfExperience;

    await counsellor.save();

    res.status(200).json({
      message: 'Profile updated successfully',
      counsellor: {
        ...counsellor.toObject(),
        password: undefined,
      },
    });
  } catch (err) {
    console.error('Error updating counsellor profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
