/**
 * @extends Error
 */
export interface ExtendableErrorOptions {
  message: string;
  errors?: any;
  status?: number;
  isPublic?: boolean;
  stack?: string;
}

export class ExtendableError extends Error {
  errors?: any;
  status?: number;
  isPublic?: boolean;
  isOperational: boolean;

  constructor({ message, errors, status, isPublic, stack }: ExtendableErrorOptions) {
    super(message);
    this.name = this.constructor.name;
    this.message = message;
    this.errors = errors;
    this.status = status;
    this.isPublic = isPublic;
    this.isOperational = true; // This is required since bluebird 4 doesn't append it anymore.
    this.stack = stack;
    // Error.captureStackTrace(this, this.constructor.name);
  }
}
