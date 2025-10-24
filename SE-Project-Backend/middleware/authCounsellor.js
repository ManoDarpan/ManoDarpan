import jwt from 'jsonwebtoken';
import Counsellor from '../models/counsellorModel.js';

export const authenticateCounsellor = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "No token provided" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const counsellor = await Counsellor.findById(decoded.id).select('-password');
        if (!counsellor) {
            return res.status(404).json({ message: "Counsellor not found" });
        }

        req.counsellor = counsellor;
        next();
    } catch (error) {
        return res.status(500).json({ message: "Server error", error });
    }
};
