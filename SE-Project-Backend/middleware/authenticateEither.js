import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import Counsellor from '../models/counsellorModel.js';

export const authenticateEither = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (user) {
      req.user = user;
      return next();
    }

    const counsellor = await Counsellor.findById(decoded.id).select('-password');
    if (counsellor) {
      req.counsellor = counsellor;
      return next();
    }

    return res.status(404).json({ message: 'User or counsellor not found' });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token', error: err.message });
  }
};
