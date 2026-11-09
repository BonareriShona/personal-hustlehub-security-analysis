
const LOG_LEVELS = {
  info: "INFO",
  warn: "WARN",
  error: "ERROR"
};

function writeLog(level, event, details = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level: LOG_LEVELS[level],
    event
  };

  // Only permit explicitly approved metadata fields.
  const allowedFields = [
    "userId",
    "role",
    "method",
    "path",
    "statusCode",
    "requestId",
    "errorType",
    "outcome"
  ];

  for (const field of allowedFields) {
    const value = details[field];

    if (
      typeof value === "string" ||
      (field === "statusCode" && typeof value === "number")
    ) {
      entry[field] = value;
    }
  }

  const output = JSON.stringify(entry);

  if (level === "error") {
    console.error(output);
  } else if (level === "warn") {
    console.warn(output);
  } else {
    console.info(output);
  }
}

module.exports = {
  info: (event, details) => writeLog("info", event, details),
  warn: (event, details) => writeLog("warn", event, details),
  error: (event, details) => writeLog("error", event, details)
};
