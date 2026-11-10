
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const logger = require("../utils/logger");

// Pre-computed hash used to reduce timing differences during failed logins.
const DUMMY_HASH =
    "$2b$12$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQR";

    function isSafeEmail(value) {
    return (
        typeof value === "string" &&
        value.length <= 254 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    );
}
/**
 * Generate a signed JSON Web Token (JWT) for an authenticated user.
 */
function createToken(user) {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured.");
    }

    return jwt.sign(
        {
            userId: user._id,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "1h"
        }
    );
}

/**
 * POST /api/auth/register
 *
 * Registers a new Client or Freelancer.
 * Passwords are securely hashed before being stored.
 */
async function register(req, res, next) {
    try {
        const { name, email, password, role } = req.body;

        if (!isSafeEmail(email)) {
    return res.status(400).json({
        success: false,
        message: "A valid email address is required."
    });
}

        // Check whether an account already exists.
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "A user with this email address already exists."
            });
        }

        // Hash the password before saving the new user.
        const passwordHash = await bcrypt.hash(password, 12);

        const newUser = await User.create({
            name,
            email,
            passwordHash,
            role
        });

        // Never include passwords or password hashes in API responses.
        return res.status(201).json({
            success: true,
            message: "Registration successful.",
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                createdAt: newUser.createdAt
            }
        });
    } catch (error) {
        // Handle duplicate accounts caused by concurrent requests.
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "A user with this email address already exists."
            });
        }

        // Handle invalid user input.
        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: "Input validation failed."
            });
        }

        next(error);
    }
}

/**
 * POST /api/auth/login
 *
 * Authenticates a user and generates a signed JWT.
 * Records successful and failed login attempts using structured logging.
 */
async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        if (!isSafeEmail(email)) {
    return res.status(400).json({
        success: false,
        message: "A valid email address is required."
    });
}

        // Retrieve the user and explicitly include their password hash.
        const user = await User.findOne({ email }).select("+passwordHash");

        // Perform a password comparison even when the user does not exist
        // to reduce account enumeration through response timing.
        const passwordMatches = user
            ? await bcrypt.compare(password, user.passwordHash)
            : await bcrypt.compare(password, DUMMY_HASH);

        // Reject invalid credentials without revealing account existence.
        if (!user || !passwordMatches) {
            logger.warn("LOGIN_FAILED", {
                method: "POST",
                path: "/api/auth/login",
                statusCode: 401,
                outcome: "failure"
            });

            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        // Generate a JWT for the authenticated user.
        const token = createToken(user);

        // Record successful authentication without logging credentials.
        logger.info("LOGIN_SUCCESS", {
            userId: user._id.toString(),
            role: user.role,
            method: "POST",
            path: "/api/auth/login",
            statusCode: 200,
            outcome: "success"
        });

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/auth/me
 *
 * Retrieves the authenticated user's profile.
 * Requires a valid JWT.
 */
async function getProfile(req, res, next) {
    try {
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        return res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    register,
    login,
    getProfile
};
