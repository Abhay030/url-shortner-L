// Logging Middleware - Mandatory for all application logging
class Logger {
  constructor() {
    this.logs = [];
    this.logLevel = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3
    };
    this.currentLevel = this.logLevel.DEBUG;
  }

  formatMessage(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      context,
      id: Math.random().toString(36).substr(2, 9)
    };
    
    this.logs.push(logEntry);
    
    // Keep only last 1000 logs to prevent memory issues
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
    
    return logEntry;
  }

  error(message, context = {}) {
    if (this.currentLevel >= this.logLevel.ERROR) {
      const logEntry = this.formatMessage('ERROR', message, context);
      console.error(`[${logEntry.timestamp}] ERROR: ${message}`, context);
      return logEntry;
    }
  }

  warn(message, context = {}) {
    if (this.currentLevel >= this.logLevel.WARN) {
      const logEntry = this.formatMessage('WARN', message, context);
      console.warn(`[${logEntry.timestamp}] WARN: ${message}`, context);
      return logEntry;
    }
  }

  info(message, context = {}) {
    if (this.currentLevel >= this.logLevel.INFO) {
      const logEntry = this.formatMessage('INFO', message, context);
      console.info(`[${logEntry.timestamp}] INFO: ${message}`, context);
      return logEntry;
    }
  }

  debug(message, context = {}) {
    if (this.currentLevel >= this.logLevel.DEBUG) {
      const logEntry = this.formatMessage('DEBUG', message, context);
      console.log(`[${logEntry.timestamp}] DEBUG: ${message}`, context);
      return logEntry;
    }
  }

  getLogs(level = null) {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
    this.info('Logs cleared');
  }

  setLogLevel(level) {
    this.currentLevel = level;
    this.info(`Log level set to ${Object.keys(this.logLevel)[level]}`);
  }
}

// Create singleton instance
const logger = new Logger();

// Log application startup
logger.info('URL Shortener Application Logger initialized');

export default logger;
