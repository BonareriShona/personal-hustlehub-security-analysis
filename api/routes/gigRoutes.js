
const express = require("express");

const {
    protect,
    authorizeRoles
} = require("../middleware/authMiddleware");

const validateGig = require("../middleware/validateGig");
const { requireGigOwner } = require("../middleware/gigOwnership");

const {
    createGig,
    getGigs,
    getGigById,
    getMyGigs,
    updateGig,
    deleteGig
} = require("../controllers/gigController");

const router = express.Router();

/*
 * Gig Management Routes
 *
 * Public users can browse gigs.
 * Authenticated Freelancers can create and manage their own gigs.
 * Admins can update and delete gigs.
 */

// Browse all gigs.
router.get("/", getGigs);

// View the authenticated Freelancer's gigs.
// This route must remain before "/:id".
router.get(
    "/mine",
    protect,
    authorizeRoles("Freelancer"),
    getMyGigs
);

// Create a new gig.
router.post(
    "/",
    protect,
    authorizeRoles("Freelancer"),
    validateGig,
    createGig
);

// View one gig.
router.get("/:id", getGigById);

// Update a gig — only its owner or an Admin may modify it.
router.put(
    "/:id",
    protect,
    authorizeRoles("Freelancer", "Admin"),
    requireGigOwner,
    validateGig,
    updateGig
);

// Delete a gig — only its owner or an Admin may delete it.
router.delete(
    "/:id",
    protect,
    authorizeRoles("Freelancer", "Admin"),
    requireGigOwner,
    deleteGig
);

module.exports = router;
