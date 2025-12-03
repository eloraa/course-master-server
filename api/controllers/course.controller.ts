import httpStatus from 'http-status';
import type { Request, Response, NextFunction } from 'express';
import { Course } from '@/schema/course';

/**
 * Create a new course
 */
export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;

    // Set instructor as the logged-in user if not provided
    if (!req.body.instructor) {
      req.body.instructor = user._id;
    }
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

    const result: any = await (Course as any).list({
      page: Number(page),
      perPage: Number(perPage),
      category,
      level,
      isPublished: isPublished === 'true',
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      search,
    });

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

    res.json({
      status: httpStatus.OK,
      message: 'Course retrieved successfully',
      data: course.transform(),
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

export default { create, list, get, update, remove };
