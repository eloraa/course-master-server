import type { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import passport from 'passport';

/**
 * Middleware to check if user is authenticated
 */
export const authorize = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('jwt', { session: false }, (err: any, user: any, info: any) => {
    if (err || !user) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        status: httpStatus.UNAUTHORIZED,
        message: 'Unauthorized',
      });
    }

    req.user = user;
    next();
  })(req, res, next);
};

/**
 * Middleware to check if user is an admin
 */
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;

  if (!user || user.role !== 'admin') {
    return res.status(httpStatus.FORBIDDEN).json({
      status: httpStatus.FORBIDDEN,
      message: 'Access denied - Admin only',
    });
  }

  next();
};
