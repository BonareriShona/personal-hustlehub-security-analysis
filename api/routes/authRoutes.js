const express = require("express");
const rateLimit = require("express-rate-limit");
const failedLoginLimiter = require("../middleware/failedLoginLimiter");

const {
    register,
    login,
    getProfile
} = require("../controllers/authController");

const {
    validateRegistration,
    validateLogin
} = require("../middleware/validateAuth");

const {
    protect
} = require("../middleware/authMiddleware");

const router = express.Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many authentication requests. Please try again later."
    }
});

router.use(authLimiter);

router.post("/register", validateRegistration, register);
router.post(
    "/login",
    failedLoginLimiter,
    validateLogin,
    login
);

// Protected profile endpoint.
router.get("/me", protect, getProfile);

module.exports = router;

