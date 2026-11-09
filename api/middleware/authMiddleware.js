const jwt = require("jsonwebtoken");

/**
 * Verifies that a request contains a valid JWT.
 */
function protect(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        // The client must send:
        // Authorization: Bearer <token>
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication token is required."
            });
        }

        const token = authHeader.split(" ")[1];

        // Verify that the token was signed using our server's secret.
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Make the authenticated user's information
        // available to the next middleware/controller.
        req.user = decoded;

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
