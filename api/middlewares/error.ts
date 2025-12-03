import { status } from 'http-status';
import expressValidation from 'express-validation';
import { vars } from '../../config/vars';
import { APIError } from '../errors/api-error';
import type { Request, Response, NextFunction } from 'express';

const { env } = vars;

/**
 * Error handler. Send stacktrace only during development
 */
export const handler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  const response = {
    code: err.status,
    message: err.message || (err.status && typeof err.status === 'number' ? status[err.status as keyof typeof status] : 'Unknown error'),
    errors: err.errors,
    stack: err.stack,
  };

  if (env !== 'development') {
    delete response.stack;
  }

  res.status(err.status);
  res.json(response);
};

/**
 * If error is not an instanceOf APIError, convert it.
 */
export const converter = (err: any, req: Request, res: Response, next: NextFunction) => {
  let convertedError = err;

  if (err instanceof expressValidation.ValidationError) {
    convertedError = new APIError({
      message: 'Validation Error',
      errors: err.error,
      status: err.statusCode || 400,
      stack: err.stack,
    });
  } else if (!(err instanceof APIError)) {
    convertedError = new APIError({
      message: err.message,
      status: err.status,
      stack: err.stack,
    });
  }

  return handler(convertedError, req, res, next);
};

/**
 * Catch 404 and forward to error handler
 */
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const err = new APIError({
    message: 'Not found',
    status: status.NOT_FOUND,
  });
  return handler(err, req, res, next);
};
