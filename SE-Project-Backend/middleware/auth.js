import jwt from 'jsonwebtoken'; // Library for JSON Web Tokens (JWT) verification
import User from '../models/userModel.js'; // Mongoose model for User

// Middleware to authenticate a user based on a JWT
export const authenticateToken = async (req, res, next) => {
    try {        
        const authHeader = req.headers.authorization; // Get Authorization header
        // Check if the header exists and starts with "Bearer "
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "No token provided" });
        }
        const token = authHeader.split(" ")[1]; // Extract the token string
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify and decode the JWT
        // Find the user in the database using the ID from the token payload, exclude password
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        req.user = user; // Attach user object to the request
        next(); // Pass control to the next middleware/route handler
    }
    catch (error) {
        // Handle errors from jwt.verify (e.g., expired or invalid signature)
        return res.status(500).json({ message: "Server error", error });
    }
}
