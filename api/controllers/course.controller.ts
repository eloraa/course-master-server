import httpStatus from 'http-status';
import type { Request, Response, NextFunction } from 'express';
import { Course } from '@/schema/course';

/**
 * Create a new course
 */
export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;

    req.body.createdBy = user._id;

    const course = new Course(req.body);
    const savedCourse: any = await course.save();

    res.status(httpStatus.CREATED).json({
      status: httpStatus.CREATED,
      message: 'Course created successfully',
      data: savedCourse.transform(),
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(httpStatus.CONFLICT).json({
        status: httpStatus.CONFLICT,
        message: 'Validation failed',
        errors: [
          {
            field: 'slug',
            message: 'Slug already exists',
          },
        ],
      });
    }
    next(error);
  }
};

/**
 * Get all courses with pagination and filters
 */
export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, perPage = 30, category, level, isPublished, minPrice, maxPrice, search } = req.query;

    const listOptions: any = {
      page: Number(page),
      perPage: Number(perPage),
      category,
      level,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      search,
    };

    // Only include isPublished if explicitly provided
    if (isPublished !== undefined) {
      listOptions.isPublished = isPublished === 'true';
    }

    const result: any = await (Course as any).list(listOptions);

    res.json({
      status: httpStatus.OK,
      message: 'Courses retrieved successfully',
      data: result.courses.map((course: any) => course.transform()),
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
 * Get course by ID or slug
 */
export const get = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    let course;

    // Try to get by ID first, then by slug
    try {
      course = await (Course as any).get(id);
    } catch (error) {
      course = await (Course as any).getBySlug(id);
    }

    // Get accurate module stats
    const moduleStats = await (Course as any).getModuleStats(course._id);

    res.json({
      status: httpStatus.OK,
      message: 'Course retrieved successfully',
      data: {
        ...course.transform(),
        moduleStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update course
 */
export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const course = await (Course as any).get(id);

    Object.assign(course, req.body);
    const updatedCourse: any = await course.save();

    res.json({
      status: httpStatus.OK,
      message: 'Course updated successfully',
      data: updatedCourse.transform(),
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(httpStatus.CONFLICT).json({
        status: httpStatus.CONFLICT,
        message: 'Validation failed',
        errors: [
          {
            field: 'slug',
            message: 'Slug already exists',
          },
        ],
      });
    }
    next(error);
  }
};

/**
 * Delete course (soft delete)
 */
export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const course = await (Course as any).get(id);

    course.deletedAt = new Date();
    await course.save();

    res.json({
      status: httpStatus.OK,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get course statistics
 */
export const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId, startDate, endDate } = req.query;

    // Build match query for orders
    const orderMatch: any = { status: 'completed' };

    if (startDate || endDate) {
      orderMatch.completedAt = {};
      if (startDate) orderMatch.completedAt.$gte = new Date(startDate as string);
      if (endDate) orderMatch.completedAt.$lte = new Date(endDate as string);
    }

    // Get courses with their stats
    let courses;
    if (courseId) {
      courses = [await (Course as any).get(courseId as string)];
    } else {
      const result: any = await (Course as any).list({
        perPage: 1000,
      });
      courses = result.courses;
    }

    // Calculate stats for each course
    const courseStats = await Promise.all(
      courses.map(async (course: any) => {
        // Get order revenue for this course
        const Order = (await import('@/schema/order')).Order;
        const orders = await Order.aggregate([
          {
            $match: orderMatch,
          },
          {
            $unwind: '$items',
          },
          {
            $match: {
              'items.course': course._id,
            },
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$total' },
              totalSales: { $sum: 1 },
            },
          },
        ]);

        const revenue = orders[0]?.totalRevenue || 0;
        const totalSales = orders[0]?.totalSales || 0;

        return {
          courseId: course._id,
          title: course.title,
          slug: course.slug,
          isPublished: course.isPublished,
          totalEnrolled: course.totalEnrolled || 0,
          revenue: revenue,
          totalSales: totalSales,
          averageRating: course.ratingAverage || 0,
          ratingCount: course.ratingCount || 0,
          totalLessons: course.modules?.reduce((sum: number, m: any) => sum + (m.lessons?.length || 0), 0) || 0,
          totalDuration: course.duration || 0,
          createdAt: course.createdAt,
        };
      })
    );

    // Calculate summary
    const summary = {
      totalCourses: courseStats.length,
      publishedCourses: courseStats.filter((c: any) => c.isPublished).length,
      draftCourses: courseStats.filter((c: any) => !c.isPublished).length,
      totalEnrollments: courseStats.reduce((sum: number, c: any) => sum + (c.totalEnrolled || 0), 0),
      totalRevenue: courseStats.reduce((sum: number, c: any) => sum + (c.revenue || 0), 0),
      averageRating: courseStats.length > 0
        ? courseStats.reduce((sum: number, c: any) => sum + (c.averageRating || 0), 0) / courseStats.length
        : 0,
    };

    res.json({
      status: httpStatus.OK,
      message: 'Course statistics retrieved successfully',
      data: {
        ...summary,
        courses: courseStats,
        summary: {
          averageEnrollmentPerCourse: summary.totalCourses > 0 ? summary.totalEnrollments / summary.totalCourses : 0,
          averageRevenuePerCourse: summary.totalCourses > 0 ? summary.totalRevenue / summary.totalCourses : 0,
          topCourse: courseStats.length > 0
            ? courseStats.reduce((top: any, c: any) => (c.revenue > (top.revenue || 0) ? c : top))
            : null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Publish course
 */
export const publish = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const course = await (Course as any).get(id);

    course.isPublished = true;
    const updatedCourse: any = await course.save();

    res.json({
      status: httpStatus.OK,
      message: 'Course published successfully',
      data: updatedCourse.transform(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Unpublish course
 */
export const unpublish = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const course = await (Course as any).get(id);

    course.isPublished = false;
    const updatedCourse: any = await course.save();

    res.json({
      status: httpStatus.OK,
      message: 'Course unpublished successfully',
      data: updatedCourse.transform(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update course visibility
 */
export const updateVisibility = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { visibility } = req.body;

    if (!['public', 'unlisted', 'private'].includes(visibility)) {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: httpStatus.BAD_REQUEST,
        message: 'Validation failed',
        errors: [
          {
            field: 'visibility',
            message: 'visibility must be one of: public, unlisted, private',
          },
        ],
      });
    }

    const course = await (Course as any).get(id);
    course.visibility = visibility;
    const updatedCourse: any = await course.save();

    res.json({
      status: httpStatus.OK,
      message: 'Course visibility updated successfully',
      data: updatedCourse.transform(),
    });
  } catch (error) {
    next(error);
  }
};

export default { create, list, get, update, remove, publish, unpublish, updateVisibility, getStats };
