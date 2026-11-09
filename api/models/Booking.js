const mongoose = require("mongoose");

/*
 * A booking links one client to one gig. Gig title and price are copied onto
 * the booking at creation so later edits to the gig cannot change what the
 * client agreed to pay.
 *
 * A booking is created already confirmed: the simulated payment/confirmation
 * happens as part of creating it, and the matching transaction record is
 * created in the same request, so every booking has exactly one transaction.
 */
const bookingSchema = new mongoose.Schema(
    {
        gig: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Gig",
            required: [true, "Gig is required."],
            index: true,
            immutable: true
        },

        gigTitle: {
            type: String,
            required: true,
            trim: true,
            immutable: true
        },

        price: {
            type: Number,
            required: true,
            min: [0.01, "Booking price must be greater than zero."],
            immutable: true
        },

        // Stored as strings to match Gig.freelancer, which holds the JWT userId.
        client: {
            type: String,
            required: [true, "Client ID is required."],
            index: true,
            immutable: true
        },

        freelancer: {
            type: String,
            required: [true, "Freelancer ID is required."],
            index: true,
            immutable: true
        },

        notes: {
            type: String,
            trim: true,
            maxlength: [500, "Notes cannot exceed 500 characters."],
            default: ""
        },

        status: {
            type: String,
            enum: ["confirmed", "cancelled"],
            default: "confirmed",
            index: true
        },

        // Simulated payment reference and the reference of the transaction
        // record created for this booking.
        paymentReference: {
            type: String,
            required: true,
            immutable: true
        },

        transactionReference: {
            type: String,
            required: true,
            immutable: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Booking", bookingSchema);
