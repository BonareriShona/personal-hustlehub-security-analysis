// Handles requests that match no route. Registered after all routes so
// that anything reaching it is genuinely an unknown endpoint.
const notFoundHandler = (req, res) => {
    return res.status(404).json({
        success: false,
        message: 'API endpoint not found.'
    });
};

module.exports = notFoundHandler;