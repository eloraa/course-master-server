import fs from 'node:fs';
import path from 'node:path';
import winston from 'winston';

const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({
      dirname: logDir,
      filename: 'error.log',
      level: 'error',
    }),
    new winston.transports.File({
      dirname: logDir,
      filename: 'combined.log',
    }),
  ],
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

logger.stream({
  write: (message: string) => {
    logger.info(message.trim());
  },
});

export { logger };
