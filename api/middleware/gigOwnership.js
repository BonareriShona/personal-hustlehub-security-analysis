const mongoose = require("mongoose");
const Gig = require("../models/Gig");

// Loads the gig named in the route and confirms the authenticated user owns it.
//
// Role checks answer "what kind of user is this?" — this answers "is this
// particular resource theirs?". Without it, any authenticated Freelancer
// could edit or delete another Freelancer's gig by guessing its ID.
async function requireGigOwner(req, res, next) {
    try {
        const { id } = req.params;

        // Reject malformed IDs before they reach the database.
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid gig identifier."
            });
        }

        const gig = await Gig.findById(id);

        if (!gig) {
            return res.status(404).json({
                success: false,
                message: "Gig not found."
            });
        }

        // String() on both sides so the comparison holds whether the schema
        // stores the owner as a string or as an ObjectId.
        const isOwner = String(gig.freelancer) === String(req.user.userId);
        const isAdmin = req.user.role === "Admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to modify this gig."
            });
        }

        // Attached so the controller does not have to query for it again.
        req.gig = gig;

        next();
    } catch (error) {
        next(error);
    }
}

module.exports = { requireGigOwner };