
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const logger = require("../utils/logger");

// Pre-computed hash used to reduce timing differences during failed logins.
const DUMMY_HASH =
    "$2b$12$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQR";

/**
 * Validate email input before any MongoDB operation.
 */
function isSafeEmail(value) {
    if (
        typeof value !== "string" ||
        value.length === 0 ||
        value.length > 254 ||
        /\s/.test(value)
    ) {
        return false;
    }

    const atIndex = value.indexOf("@");

    // Require exactly one @, with text before and after it.
    if (
        atIndex <= 0 ||
        atIndex !== value.lastIndexOf("@")
    ) {
        return false;
    }

    const domain = value.slice(atIndex + 1);
    const dotIndex = domain.lastIndexOf(".");

    return dotIndex > 0 && dotIndex < domain.length - 1;
}

/**
 * Return a validated email string or null.
 *
 * The allowlist restricts input to characters supported by
 * this application's email format.
 *
 * Reject unsafe input instead of silently modifying it.
 */
function getSafeEmail(value) {
    if (!isSafeEmail(value)) {
        return null;
    }

    const sanitized = value.replace(
        /[^a-zA-Z0-9@._%+-]/g,
        ""
    );

    if (sanitized !== value) {
        return null;
    }

    return sanitized;
}

/**
 * Generate a signed JSON Web Token (JWT).
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

        const safeEmail = getSafeEmail(email);

        if (safeEmail === null) {
            return res.status(400).json({
                success: false,
                message: "A valid email address is required."
            });
        }

        // Use the validated email for the database query.
        const existingUser = await User.findOne({
            email: { $eq: safeEmail }
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message:
                    "A user with this email address already exists."
            });
        }

        // Hash the password before saving the new user.
        const passwordHash = await bcrypt.hash(password, 12);

        // Store the validated email value.
        const newUser = await User.create({
            name,
            email: safeEmail,
            passwordHash,
            role
        });

        // Never include passwords or hashes in API responses.
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
                message:
                    "A user with this email address already exists."
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
 * Authenticates users and generates signed JWTs.
 * Records successful and failed login attempts.
 */
async function login(req, res, next) {
    try {
        const { email, password } = req.body;

        const safeEmail = getSafeEmail(email);

        if (safeEmail === null) {
            return res.status(400).json({
                success: false,
                message: "A valid email address is required."
            });
        }

        // Use the validated email for authentication lookup.
        const user = await User.findOne({
            email: { $eq: safeEmail }
        }).select("+passwordHash");

        // Reduce account enumeration through response timing.
        const passwordMatches = user
            ? await bcrypt.compare(
                password,
                user.passwordHash
            )
            : await bcrypt.compare(
                password,
                DUMMY_HASH
            );

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

        // Log success without exposing credentials.
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
