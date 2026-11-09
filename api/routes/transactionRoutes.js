const express = require("express");
const rateLimit = require("express-rate-limit");

const {
    protect,
    authorizeRoles
} = require("../middleware/authMiddleware");

const {
    getMyTransactions,
    getIncomeSummary,
    getAllTransactions
} = require("../controllers/transactionController");

const router = express.Router();

const transactionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many transaction requests. Please try again in 15 minutes."
    }
});

router.use(transactionLimiter);

// Client: what they paid. Freelancer: what they earned.
router.get(
    "/mine",
    protect,
    authorizeRoles("Client", "Freelancer"),
    getMyTransactions
);

// Freelancer income tracking.
router.get(
    "/income",
    protect,
    authorizeRoles("Freelancer"),
    getIncomeSummary
);

// Admin overview.
router.get("/", protect, authorizeRoles("Admin"), getAllTransactions);

module.exports = router;
