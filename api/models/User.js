const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            minlength: [2, "Name must be at least 2 characters"],
            maxlength: [50, "Name must not exceed 50 characters"]
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "A valid email address is required"]
        },
        passwordHash: {
            type: String,
            required: [true, "Password hash is required"],
            // Excluded from query results by default so the hash cannot be
            // returned accidentally. Login re-includes it explicitly.
            select: false
        },
        role: {
            type: String,
            required: true,
            // Allow-list. Admin exists here but is rejected at registration,
            // so nobody can assign themselves administrative privileges.
            enum: ["Client", "Freelancer", "Admin"],
            default: "Client"
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);