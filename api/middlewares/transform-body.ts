import type { Request, Response, NextFunction } from 'express';

/**
 * Middleware to transform form-data string values to proper types
 * Handles: numbers, booleans, arrays, and nested objects
 */
export const transformBody = (req: Request, res: Response, next: NextFunction) => {
  if (!req.body || typeof req.body !== 'object') {
    return next();
  }

  const transform = (obj: any): any => {
    const transformed: any = {};

    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) {
        transformed[key] = value;
        continue;
      }

      if (typeof value === 'string') {
        // Try to parse as number
        if (/^\d+(\.\d+)?$/.test(value)) {
          transformed[key] = parseFloat(value);
        }
        // Parse booleans
        else if (value === 'true') {
          transformed[key] = true;
        } else if (value === 'false') {
          transformed[key] = false;
        }
        // Try to parse JSON arrays/objects
        else if ((value.startsWith('[') && value.endsWith(']')) || (value.startsWith('{') && value.endsWith('}'))) {
          try {
            transformed[key] = JSON.parse(value);
          } catch {
            transformed[key] = value;
          }
        } else {
          transformed[key] = value;
        }
      } else if (Array.isArray(value)) {
        transformed[key] = value.map(item => (typeof item === 'object' ? transform(item) : item));
      } else if (typeof value === 'object') {
        transformed[key] = transform(value);
      } else {
        transformed[key] = value;
      }
    }

    return transformed;
  };

  req.body = transform(req.body);
  next();
};
