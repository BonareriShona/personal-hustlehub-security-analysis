
const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  const statusCode =
    Number.isInteger(err.statusCode) &&
    err.statusCode >= 400 &&
    err.statusCode <= 599
      ? err.statusCode
      : 500;

  const message =
    statusCode === 500
      ? "An unexpected server error occurred."
      : err.message;

  // Log only approved metadata, never raw request data,
  // query parameters, passwords, tokens or error messages.
  const logDetails = {
    method: req.method,
    path: req.route?.path || req.path,
    statusCode,
    errorType: statusCode === 500
      ? "INTERNAL_SERVER_ERROR"
      : "HTTP_ERROR",
    outcome: "failure"
  };

  if (statusCode >= 500) {
    logger.error("APPLICATION_ERROR", logDetails);
  } else {
    logger.warn("APPLICATION_ERROR", logDetails);
  }

  return res.status(statusCode).json({
    success: false,
    message
  });
};

module.exports = errorHandler;
