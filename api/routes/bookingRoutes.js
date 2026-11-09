const express = require("express");
const rateLimit = require("express-rate-limit");

const {
    protect,
    authorizeRoles
} = require("../middleware/authMiddleware");

const {
    validateBooking,
    validateObjectId
} = require("../middleware/validateBooking");

const {
    createBooking,
    getMyBookings,
    getReceivedBookings,
    getBookingById
} = require("../controllers/bookingController");

const router = express.Router();

/*
 * Rate limiting
 *
 * bookingLimiter covers every booking endpoint. createLimiter is stricter
 * and applies only to creating bookings, the action that is easiest to spam.
 * Both run before authentication so unauthenticated floods are also limited.
 */
const bookingLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many booking requests. Please try again in 15 minutes."
    }
});

const createLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many bookings created. Please try again in 15 minutes."
    }
});

router.use(bookingLimiter);

// Client creates a booking (simulated confirmation + transaction record).
router.post(
    "/",
    createLimiter,
    protect,
    authorizeRoles("Client"),
    validateBooking,
    createBooking
);

// Client's own bookings. Must stay before "/:id".
router.get("/mine", protect, authorizeRoles("Client"), getMyBookings);

// Bookings on the freelancer's own gigs. Must stay before "/:id".
router.get("/received", protect, authorizeRoles("Freelancer"), getReceivedBookings);

// One booking (participants and Admin only, checked in the controller).
router.get("/:id", protect, validateObjectId, getBookingById);

module.exports = router;
