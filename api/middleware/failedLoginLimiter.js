
const { rateLimit } = require("express-rate-limit");
const logger = require("../utils/logger");

const failedLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,

    // Count only responses with HTTP status 401.
    skipSuccessfulRequests: true,
    requestWasSuccessful: (req, res) => res.statusCode !== 401,

    standardHeaders: "draft-8",
    legacyHeaders: false,

    // Do not expose raw IP addresses in security logs.
    handler: (req, res) => {
        logger.warn("LOGIN_RATE_LIMITED", {
            method: "POST",
            path: "/api/auth/login",
            statusCode: 429,
            outcome: "failure"
        });

        return res.status(429).json({
            success: false,
            message: "Too many login attempts. Please try again later."
        });
    }
});

module.exports = failedLoginLimiter;
