import httpStatus from 'http-status';
import type { Request, Response, NextFunction } from 'express';
import { Batch } from '@/schema/batch';
import { Course } from '@/schema/course';

/**
 * Create a new batch
 */
export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;

    // Set created by
    req.body.createdBy = user._id;

    // Validate course exists
    const course = await Course.findById(req.body.course);
    if (!course) {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: httpStatus.BAD_REQUEST,
        message: 'Validation failed',
        errors: [
          {
            field: 'course',
            message: 'Course not found',
          },
        ],
      });
    }

    const batch = new Batch(req.body);
    const savedBatch: any = await batch.save();

    res.status(httpStatus.CREATED).json({
      status: httpStatus.CREATED,
      message: 'Batch created successfully',
      data: savedBatch.transform(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all batches with pagination and filters
 */
export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, perPage = 30, course, search } = req.query;

    const result: any = await (Batch as any).list({
      page: Number(page),
      perPage: Number(perPage),
      course,
      search,
    });

    res.json({
      status: httpStatus.OK,
      message: 'Batches retrieved successfully',
      data: result.batches.map((batch: any) => batch.transform()),
      pagination: {
        page: result.page,
        perPage: result.perPage,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get batch by ID
 */
export const get = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const batch = await (Batch as any).get(id);

    res.json({
      status: httpStatus.OK,
      message: 'Batch retrieved successfully',
      data: batch.transform(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update batch
 */
export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const batch = await (Batch as any).get(id);

    // If course is being changed, validate new course exists
    if (req.body.course && req.body.course.toString() !== batch.course.toString()) {
      const course = await Course.findById(req.body.course);
      if (!course) {
        return res.status(httpStatus.BAD_REQUEST).json({
          status: httpStatus.BAD_REQUEST,
          message: 'Validation failed',
          errors: [
            {
              field: 'course',
              message: 'Course not found',
            },
          ],
        });
      }
    }

    Object.assign(batch, req.body);
    const updatedBatch: any = await batch.save();

    res.json({
      status: httpStatus.OK,
      message: 'Batch updated successfully',
      data: updatedBatch.transform(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete batch
 */
export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const batch = await (Batch as any).get(id);

    // Soft delete
    batch.deletedAt = new Date();
    await batch.save();

    res.json({
      status: httpStatus.OK,
      message: 'Batch deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Publish batch
 */
export const publish = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const batch = await (Batch as any).get(id);

    batch.isPublished = true;
    const updatedBatch: any = await batch.save();

    res.json({
      status: httpStatus.OK,
      message: 'Batch published successfully',
      data: updatedBatch.transform(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Unpublish batch
 */
export const unpublish = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const batch = await (Batch as any).get(id);

    batch.isPublished = false;
    const updatedBatch: any = await batch.save();

    res.json({
      status: httpStatus.OK,
      message: 'Batch unpublished successfully',
      data: updatedBatch.transform(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update batch status
 */
export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['upcoming', 'active', 'completed', 'cancelled'].includes(status)) {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: httpStatus.BAD_REQUEST,
        message: 'Validation failed',
        errors: [
          {
            field: 'status',
            message: 'status must be one of: upcoming, active, completed, cancelled',
          },
        ],
      });
    }

    const batch = await (Batch as any).get(id);
    batch.status = status;
    const updatedBatch: any = await batch.save();

    res.json({
      status: httpStatus.OK,
      message: 'Batch status updated successfully',
      data: updatedBatch.transform(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get batches by course
 */
export const getByCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId } = req.params;
    const { page = 1, perPage = 30 } = req.query;

    const result: any = await (Batch as any).list({
      page: Number(page),
      perPage: Number(perPage),
      course: courseId,
    });

    res.json({
      status: httpStatus.OK,
      message: 'Course batches retrieved successfully',
      data: result.batches.map((batch: any) => batch.transform()),
      pagination: {
        page: result.page,
        perPage: result.perPage,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get batch statistics
 */
export const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { course, status, startDate, endDate } = req.query;

    // Build match query
    const match: any = { deletedAt: null };
    if (course) match.course = course;
    if (status) match.status = status;

    // Date range for start dates
    if (startDate || endDate) {
      match.startDate = {};
      if (startDate) match.startDate.$gte = new Date(startDate as string);
      if (endDate) match.startDate.$lte = new Date(endDate as string);
    }

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: null,
          totalBatches: { $sum: 1 },
          totalCapacity: { $sum: '$capacity' },
          totalEnrolled: { $sum: '$enrolledCount' },
          totalAvailable: { $sum: { $subtract: ['$capacity', '$enrolledCount'] } },
          averageOccupancy: { $avg: { $divide: ['$enrolledCount', '$capacity'] } },
        },
      },
      {
        $addFields: {
          occupancyRate: { $multiply: ['$averageOccupancy', 100] },
        },
      },
    ];

    const stats = await (Batch as any).aggregate(pipeline);

    // Get status breakdown
    const statusBreakdown = await (Batch as any).aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalEnrolled: { $sum: '$enrolledCount' },
        },
      },
    ]);

    // Get monthly batch trends (last 12 months)
    const monthlyTrends = await (Batch as any).aggregate([
      {
        $match: {
          ...match,
          startDate: {
            $gte: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000),
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$startDate' },
            month: { $month: '$startDate' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const result = {
      summary: stats[0] || {
        totalBatches: 0,
        totalCapacity: 0,
        totalEnrolled: 0,
        totalAvailable: 0,
        occupancyRate: 0,
      },
      statusBreakdown: statusBreakdown.reduce((acc: any, item: any) => {
        acc[item._id] = {
          count: item.count,
          totalEnrolled: item.totalEnrolled,
        };
        return acc;
      }, {}),
      monthlyTrends,
    };

    res.json({
      status: httpStatus.OK,
      message: 'Batch statistics retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  create,
  list,
  get,
  update,
  remove,
  publish,
  unpublish,
  updateStatus,
  getByCourse,
  getStats,
};