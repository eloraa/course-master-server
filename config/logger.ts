import fs from 'node:fs';
import path from 'node:path';
import winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';
const transports: winston.transport[] = [];

// In production (Vercel), only use console transport
// Vercel captures console logs automatically
if (isProduction) {
  transports.push(
    new winston.transports.Console({
      format: winston.format.json(),
    })
  );
} else {
  // In development, use file transports
  const logDir = path.join(__dirname, '..', 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  transports.push(
    new winston.transports.File({
      dirname: logDir,
      filename: 'error.log',
      level: 'error',
    }),
    new winston.transports.File({
      dirname: logDir,
      filename: 'combined.log',
    }),
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports,
});

logger.stream({
  write: (message: string) => {
    logger.info(message.trim());
  },
});

export { logger };
