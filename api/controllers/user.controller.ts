import httpStatus from 'http-status';
import type { Request, Response, NextFunction } from 'express';
import { User } from '@/schema/user';

/**
 * Get user statistics
 */
export const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role, startDate, endDate } = req.query;

    const stats = await (User as any).getStats({
      role,
      startDate,
      endDate,
    });

    res.json({
      status: httpStatus.OK,
      message: 'User statistics retrieved successfully',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export default { getStats };
