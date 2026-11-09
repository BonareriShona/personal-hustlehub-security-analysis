const mongoose = require("mongoose");

// Connects the API to MongoDB Atlas using the URI from the environment.
// The connection string is never hard-coded because it contains credentials.
async function connectDB() {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is not configured.");
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected.");
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);

        // Exit rather than run without a database. An API that starts
        // without storage produces confusing, inconsistent behaviour.
        process.exit(1);
    }
}

module.exports = connectDB;