
const crypto = require("crypto");

const Booking = require("../models/Booking");
const Gig = require("../models/Gig");
const Transaction = require("../models/Transaction");
const logger = require("../utils/logger");

/*
 * Booking Controller
 *
 * Payment is simulated. Creating a booking confirms it immediately and
 * records a transaction linking the client, freelancer and amount.
 *
 * Security events are recorded using structured logging without exposing
 * passwords, tokens, payment references or private booking details.
 */

function reference(prefix) {
    return `${prefix}-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
}

/**
 * Client books a gig and a transaction is recorded.
 */
async function createBooking(req, res, next) {
    try {
        const { gigId, notes } = req.body;

        const gig = await Gig.findById(gigId);

        if (!gig) {
            return res.status(404).json({
                success: false,
                message: "Gig not found."
            });
        }

        // The client and freelancer identities are server-controlled.
        // Freelancers cannot book their own gigs.
        if (String(gig.freelancer) === String(req.user.userId)) {
            logger.warn("BOOKING_ACCESS_DENIED", {
                userId: String(req.user.userId),
                role: req.user.role,
                method: "POST",
                path: "/api/bookings",
                statusCode: 403,
                outcome: "denied"
            });

            return res.status(403).json({
                success: false,
                message: "You cannot book your own gig."
            });
        }

        // Create the booking using trusted server-side values.
        const booking = await Booking.create({
            gig: gig._id,
            gigTitle: gig.title,
            price: gig.price,
            client: req.user.userId,
            freelancer: gig.freelancer,
            notes: notes || "",
            paymentReference: reference("PAY"),
            transactionReference: reference("TXN")
        });

        let transaction;

        try {
            transaction = await Transaction.create({
                booking: booking._id,
                client: booking.client,
                freelancer: booking.freelancer,
                gigTitle: booking.gigTitle,
                amount: booking.price,
                reference: booking.transactionReference
            });
        } catch (transactionError) {
            logger.error("TRANSACTION_FAILED", {
                userId: String(req.user.userId),
                role: req.user.role,
                method: "POST",
                path: "/api/bookings",
                statusCode: 500,
                errorType: transactionError.name || "TransactionError",
                outcome: "failed"
            });

            // Preserve the existing compensating rollback behaviour.
            // If transaction creation fails, remove its booking.
            await Booking.deleteOne({ _id: booking._id });

            throw transactionError;
        }

        // Log these events only after both records are created.
        logger.info("BOOKING_CREATED", {
            userId: String(req.user.userId),
            role: req.user.role,
            method: "POST",
            path: "/api/bookings",
            statusCode: 201,
            outcome: "success"
        });

        logger.info("TRANSACTION_RECORDED", {
            userId: String(req.user.userId),
            role: req.user.role,
            method: "POST",
            path: "/api/bookings",
            statusCode: 201,
            outcome: "success"
        });

        return res.status(201).json({
            success: true,
            message: "Booking confirmed and transaction recorded.",
            booking,
            transaction
        });

    } catch (error) {
        logger.error("BOOKING_FAILED", {
            userId: req.user?.userId
                ? String(req.user.userId)
                : undefined,
            role: req.user?.role,
            method: "POST",
            path: "/api/bookings",
            statusCode: error.name === "ValidationError" ? 400 : 500,
            errorType: error.name || "BookingError",
            outcome: "failed"
        });

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        next(error);
    }
}

/**
 * Bookings made by the authenticated client.
 */
async function getMyBookings(req, res, next) {
    try {
        const bookings = await Booking.find({
            client: req.user.userId
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: bookings.length,
            bookings
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Bookings placed on the authenticated freelancer's gigs.
 */
async function getReceivedBookings(req, res, next) {
    try {
        const bookings = await Booking.find({
            freelancer: req.user.userId
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: bookings.length,
            bookings
        });
    } catch (error) {
        next(error);
    }
}

/**
 * One booking, visible to its participants or an Admin.
 */
async function getBookingById(req, res, next) {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found."
            });
        }

        const { userId, role } = req.user;

        const isParticipant =
            String(booking.client) === String(userId) ||
            String(booking.freelancer) === String(userId);

        if (!isParticipant && role !== "Admin") {
            logger.warn("BOOKING_ACCESS_DENIED", {
                userId: String(userId),
                role,
                method: "GET",
                path: "/api/bookings/:id",
                statusCode: 403,
                outcome: "denied"
            });

            return res.status(403).json({
                success: false,
                message: "You are not authorised to access this resource."
            });
        }

        return res.status(200).json({
            success: true,
            booking
        });

    } catch (error) {
        next(error);
    }
}

module.exports = {
    createBooking,
    getMyBookings,
    getReceivedBookings,
    getBookingById
};
