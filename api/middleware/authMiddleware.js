
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

/**
 * Verifies that a request contains a valid JWT.
 * Validates the decoded user identity before allowing access
 * to protected routes and database operations.
 */
function protect(req, res, next) {
    try {
        const authHeader = req.headers?.authorization;

        // Require a Bearer authentication token.
        if (
            typeof authHeader !== "string" ||
            !authHeader.startsWith("Bearer ")
        ) {
            return res.status(401).json({
                success: false,
                message: "Authentication token is required."
            });
        }

        const token = authHeader.slice(7).trim();

        // Reject an empty or malformed Bearer token.
        if (!token || /\s/.test(token)) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token."
            });
        }

        // Verify the JWT signature and expiration.
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET,
            {
                algorithms: ["HS256"]
            }
        );

        // Reject invalid payloads and malformed user identifiers.
        // MongoDB user IDs must be valid ObjectId strings.
        if (
            !decoded ||
            typeof decoded !== "object" ||
            Array.isArray(decoded) ||
            typeof decoded.userId !== "string" ||
            !mongoose.isObjectIdOrHexString(decoded.userId) ||
            !["Client", "Freelancer", "Admin"].includes(decoded.role)
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token."
            });
        }

        // Expose only approved, validated identity fields.
        // Do not forward arbitrary JWT claims to controllers.
        req.user = {
            userId: decoded.userId,
            role: decoded.role
        };

        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired authentication token."
        });
    }
}

/**
 * Restricts a route to specific user roles.
 *
 * Example:
 * authorizeRoles("Freelancer")
 */
function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication is required."
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorised to access this resource."
            });
        }

        next();
    };
}

module.exports = {
    protect,
    authorizeRoles
};
