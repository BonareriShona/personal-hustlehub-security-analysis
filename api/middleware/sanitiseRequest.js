/*
 * Request sanitisation.
 *
 * Removes MongoDB query operators and control characters from incoming data.
 * A request body such as { "email": { "$ne": null } } would otherwise be
 * passed straight into a query and match the first user in the collection.
 *
 * Express 5 exposes req.query as a read-only getter, so this middleware
 * mutates req.body and req.params in place rather than reassigning them.
 * (This is also why express-mongo-sanitize cannot be used on Express 5.)
 */

function sanitiseObject(obj) {
    if (obj === null || typeof obj !== "object") {
        return;
    }

    for (const key of Object.keys(obj)) {
        // Keys beginning with $ are MongoDB operators.
        if (key.startsWith("$")) {
            delete obj[key];
            continue;
        }

        // Dotted keys can reach into nested document fields.
        if (key.includes(".")) {
            delete obj[key];
            continue;
        }

        const value = obj[key];

        if (value !== null && typeof value === "object") {
            sanitiseObject(value);
        } else if (typeof value === "string") {
            // Null bytes can truncate strings in some database drivers.
            obj[key] = value.replace(/\0/g, "");
        }
    }
}

function sanitiseRequest(req, res, next) {
    sanitiseObject(req.body);
    sanitiseObject(req.params);
    next();
}

module.exports = sanitiseRequest;