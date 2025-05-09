import winston from "winston";

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    // Stringify objects and handle other types properly
    const formattedMessage =
      typeof message === "object"
        ? JSON.stringify(message, null, 2)
        : String(message);

    return `${timestamp} [${level}]: ${formattedMessage}${
      stack ? "\n" + stack : ""
    }`;
  })
);

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: logFormat,
  transports: process.env.NODE_ENV === 'development' ? [
    // Console transport
    new winston.transports.Console(),
    // File transport for errors
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: "logs/combined.log",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ] : [],
});

// Add a stream for Morgan middleware if needed
export const logStream = {
  write: (message: string) => {
    if (process.env.NODE_ENV === 'development') {
      logger.info(String(message).trim());
    }
  },
};

export default logger;
