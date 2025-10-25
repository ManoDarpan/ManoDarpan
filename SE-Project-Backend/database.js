import mongoose from "mongoose"; // Mongoose library for MongoDB interaction
import dotenv from "dotenv"; // Library to load environment variables from a .env file

dotenv.config(); // Load environment variables (e.g., MONGO_URI)

// Function to establish connection to MongoDB
const connectDB = async () => {
    try {
        // Attempt to connect to the MongoDB URI specified in environment variables
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected successfully"); // Log success
    } catch (error) {
        console.error("MongoDB connection failed:", error); // Log connection error
        process.exit(1); // Exit the process with failure code
    }
};

export default connectDB; // Export the connection function
