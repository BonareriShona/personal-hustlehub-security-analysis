
const mongoose = require("mongoose");
const Gig = require("../models/Gig");

/*
 * Gig Management Controller
 *
 * Handles gig creation, retrieval, updating and deletion.
 * Routes that act on a single gig rely on requireGigOwner middleware,
 * which loads the gig and confirms the authenticated user owns it.
 */

/**
 * Create a new gig.
 */
async function createGig(req, res, next) {
    try {
        // Only these four fields are read from the request body.
        // The owner comes from the verified JWT, not client input.
        const { title, description, category, price } = req.body;

        const gig = await Gig.create({
            title,
            description,
            category,
            price,
            freelancer: req.user.userId
        });

        return res.status(201).json({
            success: true,
            message: "Gig created successfully.",
            gig
        });
    } catch (error) {
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
 * Retrieve all gigs.
 */
async function getGigs(req, res, next) {
    try {
        const gigs = await Gig.find().sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: gigs.length,
            gigs
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Retrieve one gig by its ID.
 */
async function getGigById(req, res, next) {
    try {
        const { id } = req.params;

        if (
            typeof id !== "string" ||
            !mongoose.isObjectIdOrHexString(id)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid gig ID."
            });
        }

        const gig = await Gig.findById(id);

        if (!gig) {
            return res.status(404).json({
                success: false,
                message: "Gig not found."
            });
        }

        return res.status(200).json({
            success: true,
            gig
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Retrieve gigs belonging to the authenticated freelancer.
 *
 * Defence in depth: validate the JWT identity again at the
 * database-query boundary and construct a typed ObjectId.
 */
async function getMyGigs(req, res, next) {
    try {
        const userId = req.user?.userId;

        if (
            typeof userId !== "string" ||
            !mongoose.isObjectIdOrHexString(userId)
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication identity."
            });
        }

        const freelancerId = new mongoose.Types.ObjectId(userId);

        const gigs = await Gig.find({
            freelancer: freelancerId
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: gigs.length,
            gigs
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Update a gig. Ownership is enforced by requireGigOwner,
 * which attaches the loaded document as req.gig.
 */
async function updateGig(req, res, next) {
    try {
        const gig = req.gig;
        const { title, description, category, price } = req.body;

        // Update only fields provided by the client.
        if (title !== undefined) {
            gig.title = title;
        }

        if (description !== undefined) {
            gig.description = description;
        }

        if (category !== undefined) {
            gig.category = category;
        }

        if (price !== undefined) {
            gig.price = price;
        }

        await gig.save();

        return res.status(200).json({
            success: true,
            message: "Gig updated successfully.",
            gig
        });
    } catch (error) {
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
 * Delete a gig. Ownership is enforced by requireGigOwner.
 */
async function deleteGig(req, res, next) {
    try {
        await req.gig.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Gig deleted successfully."
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createGig,
    getGigs,
    getGigById,
    getMyGigs,
    updateGig,
    deleteGig
};
