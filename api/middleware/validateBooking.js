const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

/**
 * Validates the body of POST /api/bookings.
 * Only gigId and notes are accepted. Price, client and freelancer are never
 * read from the request, so they cannot be tampered with.
 */
function validateBooking(req, res, next) {
    const { gigId, notes } = req.body;

    // typeof check blocks object payloads such as { "$ne": null }.
    if (typeof gigId !== "string" || !OBJECT_ID_PATTERN.test(gigId)) {
        return res.status(400).json({
            success: false,
            message: "A valid gig ID is required."
        });
    }

    if (notes !== undefined) {
        if (typeof notes !== "string" || notes.trim().length > 500) {
            return res.status(400).json({
                success: false,
                message: "Notes must be text of no more than 500 characters."
            });
        }

        req.body.notes = notes.trim();
    }

    next();
}

/**
 * Validates the :id route parameter.
 */
function validateObjectId(req, res, next) {
    if (!OBJECT_ID_PATTERN.test(req.params.id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid booking ID."
        });
    }

    next();
}

module.exports = {
    validateBooking,
    validateObjectId
};
