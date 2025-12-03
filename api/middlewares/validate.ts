import type { Request, Response, NextFunction } from 'express';
import { type ZodType, ZodError } from 'zod';
import httpStatus from 'http-status';

export const validate = (schema: ZodType<any>) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error: any) {
    if (error instanceof ZodError) {
      const formattedErrors = error.issues.map((err: any) => {
        // Remove the 'body.', 'query.', or 'params.' prefix for cleaner field names
        const path = err.path.slice(1);
        const field = path.length > 0 ? path.join('.') : String(err.path[0] || '');

        // Provide user-friendly messages
        let message = err.message;

        // Handle common validation errors with better messages
        if (err.code === 'invalid_type') {
          if (field === 'body' && err.received === 'undefined') {
            message = 'Request body is required';
          } else if (String(err.expected) === 'string') {
            message = `${field} is required`;
          } else if (String(err.expected) === 'number') {
            message = `${field} must be a number`;
          } else {
            message = `${field} is required`;
          }
        } else if (err.code === 'too_small') {
          if (String(err.type) === 'string') {
            message = `${field} must be at least ${err.minimum} characters`;
          }
        } else if (err.code === 'too_big') {
          if (String(err.type) === 'string') {
            message = `${field} must be at most ${err.maximum} characters`;
          }
        } else if (err.code === 'invalid_format') {
          message = `${field} must be a valid email address`;
        }

        return {
          field,
          message,
        };
      });

      return res.status(httpStatus.BAD_REQUEST).json({
        status: httpStatus.BAD_REQUEST,
        message: 'Validation failed',
        errors: formattedErrors,
      });
    }
    next(error);
  }
};
