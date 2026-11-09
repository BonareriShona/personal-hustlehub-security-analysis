function sanitizeText(value) {
    return value
        .replace(/<[^>]*>/g, "")
        .trim();
}




function validateGig(req, res, next) {
    // Ensure the request body is a valid object.
    if (
        !req.body ||
        typeof req.body !== "object" ||
        Array.isArray(req.body)
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid request body."
        });
    }

    const { title, description, category, price } = req.body;

    // 1. Reject unexpected fields to prevent mass assignment.
    const allowedFields = [
        "title",
        "description",
        "category",
        "price"
    ];

    const unexpectedFields = Object.keys(req.body).filter(
        (field) => !allowedFields.includes(field)
    );

    if (unexpectedFields.length > 0) {
        return res.status(400).json({
            success: false,
            message: "Unexpected fields are not allowed."
        });
    }

    // 2. Validate title.
    if (
        typeof title !== "string" ||
        title.trim().length < 3 ||
        title.trim().length > 100
    ) {
        return res.status(400).json({
            success: false,
            message: "Title must be between 3 and 100 characters."
        });
    }

    // 3. Validate description.
    if (
        typeof description !== "string" ||
        description.trim().length < 10 ||
        description.trim().length > 1000
    ) {
        return res.status(400).json({
            success: false,
            message: "Description must be between 10 and 1000 characters."
        });
    }

    // 4. Validate category.
    if (
        typeof category !== "string" ||
        category.trim().length < 2 ||
        category.trim().length > 50
    ) {
        return res.status(400).json({
            success: false,
            message: "Category must be between 2 and 50 characters."
        });
    }

    // 5. Validate price type.
    // Accept numbers and non-empty numeric strings only.
    // Reject booleans, arrays, objects, null and undefined.
    const validPriceType =
        typeof price === "number" ||
        (
            typeof price === "string" &&
            price.trim().length > 0
        );

    const numericPrice = validPriceType
        ? Number(price)
        : NaN;

    // 6. Validate price range.
    if (
        !Number.isFinite(numericPrice) ||
        numericPrice <= 0 ||
        numericPrice > 1000000
    ) {
        return res.status(400).json({
            success: false,
            message: "Price must be a valid positive number."
        });
    }


    // 7. Sanitise the validated text fields.
    const sanitizedTitle = sanitizeText(title);
    const sanitizedDescription = sanitizeText(description);
    const sanitizedCategory = sanitizeText(category);

    // 8. Revalidate after sanitisation.
    if (sanitizedTitle.length < 3 || sanitizedTitle.length > 100) {
        return res.status(400).json({
            success: false,
            message: "Title must be between 3 and 100 characters."
        });
    }

    if (sanitizedDescription.length < 10 || sanitizedDescription.length > 1000) {
        return res.status(400).json({
            success: false,
            message: "Description must be between 10 and 1000 characters."
        });
    }

    if (sanitizedCategory.length < 2 || sanitizedCategory.length > 50) {
        return res.status(400).json({
            success: false,
            message: "Category must be between 2 and 50 characters."
        });
    }

    // 9. Normalise validated input.
    req.body.title = sanitizedTitle;
    req.body.description = sanitizedDescription;
    req.body.category = sanitizedCategory;
    req.body.price = numericPrice;

    next();

}

module.exports = validateGig;
