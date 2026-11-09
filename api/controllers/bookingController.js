const crypto = require("crypto");
const Booking = require("../models/Booking");
const Gig = require("../models/Gig");
const Transaction = require("../models/Transaction");

/*
 * Booking Controller
 *
 * Payment is simulated. Creating a booking confirms it immediately and
 * records a transaction linking the client, the freelancer and the amount,
 * so every booking has a transaction and freelancer income can be tracked
 * from the transaction records.
 */

function reference(prefix) {
    return `${prefix}-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
}

/**
 * Client books a gig (simulated confirmation) and a transaction is recorded.
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

        // Price, client and freelancer come from the database and the verified
        // JWT, never from the request body.
        // A freelancer must not be able to book their own gig and
        // manufacture income for themselves.
        if (String(gig.freelancer) === String(req.user.userId)) {
            return res.status(403).json({
                success: false,
                message: "You cannot book your own gig."
            });
        }
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
            // Never leave a booking without its transaction.
            await Booking.deleteOne({ _id: booking._id });

            throw transactionError;
        }

        return res.status(201).json({
            success: true,
            message: "Booking confirmed and transaction recorded.",
            booking,
            transaction
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({ success: false, message: error.message });
        }

        next(error);
    }
}

/**
 * Bookings made by the authenticated client.
 */
async function getMyBookings(req, res, next) {
    try {
        const bookings = await Booking.find({ client: req.user.userId })
            .sort({ createdAt: -1 });

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
        const bookings = await Booking.find({ freelancer: req.user.userId })
            .sort({ createdAt: -1 });

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
 * One booking. Visible only to its client, its freelancer or an Admin.
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
            return res.status(403).json({
                success: false,
                message: "You are not authorised to access this resource."
            });
        }

        return res.status(200).json({ success: true, booking });
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

