const mongoose = require("mongoose");

/*
 * A transaction is created exactly once, when a booking is completed.
 * The unique index on "booking" guarantees a booking can never be
 * recorded twice, even if two requests race.
 */
const transactionSchema = new mongoose.Schema(
    {
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
            required: true,
            unique: true,
            immutable: true
        },

        client: {
            type: String,
            required: true,
            index: true,
            immutable: true
        },

        freelancer: {
            type: String,
            required: true,
            index: true,
            immutable: true
        },

        gigTitle: {
            type: String,
            required: true,
            immutable: true
        },

        amount: {
            type: Number,
            required: true,
            min: [0.01, "Transaction amount must be greater than zero."],
            immutable: true
        },

        reference: {
            type: String,
            required: true,
            unique: true,
            immutable: true
        },

        status: {
            type: String,
            enum: ["Completed"],
            default: "Completed"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Transaction", transactionSchema);
