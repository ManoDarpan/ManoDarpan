import jwt from 'jsonwebtoken'; // Library for JWT verification
import User from '../models/userModel.js'; // Mongoose model for User
import Counsellor from '../models/counsellorModel.js'; // Mongoose model for Counsellor

// Middleware to authenticate either a User OR a Counsellor from the same token
export const authenticateEither = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' }); // Missing token check
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify and decode token

    // Attempt to find a User with the decoded ID
    const user = await User.findById(decoded.id).select('-password');
    if (user) {
      req.user = user; // Attach User object
      return next(); // Proceed as User
    }

    // If not a User, attempt to find a Counsellor with the same ID
    const counsellor = await Counsellor.findById(decoded.id).select('-password');
    if (counsellor) {
      req.counsellor = counsellor; // Attach Counsellor object
      return next(); // Proceed as Counsellor
    }

    // If ID doesn't match either model
    return res.status(404).json({ message: 'User or counsellor not found' });
  } catch (err) {
    // Handle JWT errors (e.g., expired, invalid signature)
    return res.status(401).json({ message: 'Invalid token', error: err.message });
  }
};
