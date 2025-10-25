import bcrypt from "bcrypt"; // Library for password hashing
import jwt from "jsonwebtoken"; // Library for creating/verifying JWTs
import crypto from 'crypto'; // Node.js built-in crypto module
import Counsellor from "../models/counsellorModel.js"; // Mongoose model for Counsellor
import { getOnlineCounsellors } from '../utils/socketManager.js'; // Utility to get online status
import { OAuth2Client } from 'google-auth-library'; // Google client for ID token verification

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID); // Initialize Google OAuth client

// Controller to fetch a list of counsellors
export const getCounsellors = async (req, res) => {
    try {
  // Fetch limited counsellor data
  const counsellors = await Counsellor.find({}, 'name username areaOfExpertise profilePic').limit(10);
    // Get set of currently online counsellor IDs
    const onlineSet = getOnlineCounsellors();
    // Annotate counsellors with their online status
    const annotated = counsellors.map(c => ({
      _id: c._id,
      name: c.name,
      username: c.username,
      areaOfExpertise: c.areaOfExpertise,
      profilePic: c.profilePic || null,
      isOnline: onlineSet.has(String(c._id)) // Check if ID is in the online set
    }));
    res.status(200).json({ counsellors: annotated });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching counsellors', error: error.message });
    }
};

// Controller to handle Google Sign-In authentication for counsellors
export const googleAuthCounsellor = async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) return res.status(400).json({ message: 'Missing idToken' });
        // Verify the Google ID token
        const ticket = await googleClient.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
        const payload = ticket.getPayload();
        const email = payload.email;
    const name = payload.name || payload.email.split('@')[0];
    const profilePic = payload.picture;

        // Find existing counsellor by email
        let c = await Counsellor.findOne({ email });
    if (!c) {
      // If not found, create a new counsellor account
      const rand = crypto.randomBytes(16).toString('hex');
      const hashed = await bcrypt.hash(rand, 10); // Use dummy/random password for Google-only login
      c = new Counsellor({ name, username: email, email, password: hashed, areaOfExpertise: 'General', yearsOfExperience: 0, profilePic });
      await c.save();
    } else {
      // Update profile picture and name if missing/new from Google
      if (profilePic) {
        c.profilePic = profilePic;
      }
      if ((!c.name || c.name.length === 0) && name) {
        c.name = name;
      }
      await c.save();
    }
        // Create and sign a JWT for the counsellor
        const token = jwt.sign({ id: c._id, role: 'counsellor' }, process.env.JWT_SECRET, { expiresIn: '3h' });
    res.status(200).json({ token, message: 'Authentication successful', counsellor: { id: c._id, name: c.name, username: c.username, profilePic: c.profilePic } });
    } catch (err) {
        console.error('googleAuthCounsellor error', err);
        res.status(401).json({ message: 'Invalid Google token', error: err.message });
    }
};

// Controller to fetch the logged-in counsellor's profile
export const getProfile = async (req, res) => {
  try {
    // Find by ID from the authenticated request object, exclude password
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

// Controller to update the logged-in counsellor's profile
export const updateProfile = async (req, res) => {
  try {
    const { areaOfExpertise, yearsOfExperience } = req.body;

    // Find the counsellor to update
    const counsellor = await Counsellor.findById(req.counsellor._id);
    if (!counsellor) {
      return res.status(404).json({ message: 'Counsellor not found' });
    }

    // Apply updates if fields are present in the request body
    if (areaOfExpertise) counsellor.areaOfExpertise = areaOfExpertise;
    if (yearsOfExperience !== undefined) counsellor.yearsOfExperience = yearsOfExperience;

    await counsellor.save(); // Save changes

    // Return updated profile data (excluding password)
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
