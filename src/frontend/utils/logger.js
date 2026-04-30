/**
 * KrishiSaathi Production-Safe Logger
 * - Suppresses logs in production
 * - Preserves errors and warnings
 */

const IS_PROD = import.meta.env.MODE === 'production';

export const logger = {
  log: (...args) => {
    if (!IS_PROD) {
      console.log(...args);
    }
  },
  info: (...args) => {
    if (!IS_PROD) {
      console.info(...args);
    }
  },
  warn: (...args) => {
    // Warnings are kept in prod for debugging critical issues
    console.warn(...args);
  },
  error: (...args) => {
    // Errors are always kept
    console.error(...args);
  },
  debug: (...args) => {
    if (!IS_PROD) {
      console.debug(...args);
    }
  }
};

export default logger;
