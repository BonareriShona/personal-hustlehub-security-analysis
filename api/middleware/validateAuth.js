// Authentication input validation middleware.
// Validation is kept server-side so invalid registration/login data
// never reaches the controller logic.

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateRegistration(req, res, next) {
    const { name, email, password, role } = req.body;
    const errors = [];

    if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 50) {
        errors.push({
            field: "name",
            message: "Name must be between 2 and 50 characters."
        });
    }

    if (typeof email !== "string" || !isValidEmail(email.trim())) {
        errors.push({
            field: "email",
            message: "A valid email address is required."
        });
    }

    // The upper bound matters because bcrypt silently truncates input at
    // 72 bytes. Without it, only the first 72 characters would be verified.
    if (typeof password !== "string" || password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
        errors.push({
            field: "password",
            message: "Password must be at least 8 characters and no more than 72 bytes."
        });
    } else {
        if (!/[A-Z]/.test(password)) {
            errors.push({
                field: "password",
                message: "Password must contain at least one uppercase letter."
            });
        }

        if (!/[a-z]/.test(password)) {
            errors.push({
                field: "password",
                message: "Password must contain at least one lowercase letter."
            });
        }

        if (!/[0-9]/.test(password)) {
            errors.push({
                field: "password",
                message: "Password must contain at least one number."
            });
        }
    }

    // Public registration is limited to the two normal marketplace roles.
    // Admin accounts should be created through a separate trusted process.
    if (!['Client', 'Freelancer'].includes(role)) {
        errors.push({
            field: "role",
            message: "Role must be Client or Freelancer."
        });
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: "Input validation failed.",
            errors
        });
    }

    // Normalise values before the controller uses them.
    req.body.name = name.trim();
    req.body.email = email.trim().toLowerCase();

    next();
}

function validateLogin(req, res, next) {
    const { email, password } = req.body;
    const errors = [];

    if (typeof email !== "string" || !isValidEmail(email.trim())) {
        errors.push({
            field: "email",
            message: "A valid email address is required."
        });
    }

    if (typeof password !== "string" || password.length === 0) {
        errors.push({
            field: "password",
            message: "Password is required."
        });
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: "Input validation failed.",
            errors
        });
    }

    req.body.email = email.trim().toLowerCase();

    next();
}

module.exports = {
    validateRegistration,
    validateLogin
};

