// This flag determines whether logging is enabled or disabled
export enum LogLevel {
  debug = 0,
  info = 1,
  warn = 2,
  error = 3,
  disabled = 4,
}

let logLevel = LogLevel.disabled;

// Function to enable or disable logging
export const setLogLevel = (level: LogLevel) => {
  logLevel = level;
};

// Logger object with methods corresponding to console methods
export const logger = {
  // eslint-disable-next-line
  log: (...args: any[]) => {
    if (logLevel <= LogLevel.info) {
      console.log(...args);
    }
  },
  // eslint-disable-next-line
  error: (...args: any[]) => {
    if (logLevel <= LogLevel.error) {
      console.error(...args);
    }
  },
  // eslint-disable-next-line
  warn: (...args: any[]) => {
    if (logLevel <= LogLevel.warn) {
      console.warn(...args);
    }
  },
  // eslint-disable-next-line
  info: (...args: any[]) => {
    if (logLevel <= LogLevel.info) {
      console.info(...args);
    }
  },
  // eslint-disable-next-line
  debug: (...args: any[]) => {
    if (logLevel <= LogLevel.debug) {
      console.debug(...args);
    }
  },
};
