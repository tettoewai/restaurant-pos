import pino from "pino";

const isDevelopment = process.env.NODE_ENV === "development";
// Disable pino-pretty in Next.js server context to avoid worker thread issues
// pino-pretty uses worker threads which can cause module resolution errors in Next.js
const isNextServer = typeof process !== "undefined" && process.env.NEXT_RUNTIME;

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info"),
  // Only use pino-pretty in development when not in Next.js server runtime
  transport:
    isDevelopment && !isNextServer
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        }
      : undefined,
  base: {
    env: process.env.NODE_ENV,
  },
});

// Helper functions for common log types
export const logError = (error: unknown, context?: Record<string, unknown>) => {
  if (error instanceof Error) {
    logger.error(
      {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        ...context,
      },
      error.message
    );
  } else {
    logger.error({ error, ...context }, "Unknown error occurred");
  }
};

export const logInfo = (message: string, context?: Record<string, unknown>) => {
  logger.info(context, message);
};

export const logWarn = (message: string, context?: Record<string, unknown>) => {
  logger.warn(context, message);
};

export const logDebug = (
  message: string,
  context?: Record<string, unknown>
) => {
  logger.debug(context, message);
};
