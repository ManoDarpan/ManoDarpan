import jwt from 'jsonwebtoken'; // Library for JSON Web Tokens (JWT) verification
import Counsellor from '../models/counsellorModel.js'; // Mongoose model for Counsellor

// Middleware to authenticate a counsellor based on a JWT
export const authenticateCounsellor = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization; // Get Authorization header
        // Check if the header is correctly formatted
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "No token provided" });
        }

        const token = authHeader.split(" ")[1]; // Extract the token string
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify and decode the JWT

        // Find the counsellor in the database using the ID from the token, exclude password
        const counsellor = await Counsellor.findById(decoded.id).select('-password');
        if (!counsellor) {
            return res.status(404).json({ message: "Counsellor not found" });
        }

        req.counsellor = counsellor; // Attach counsellor object to the request
        next(); // Pass control to the next middleware/route handler
    } catch (error) {
        // Handle errors from jwt.verify or database lookup failure
        return res.status(500).json({ message: "Server error", error });
    }
};
