import httpStatus from 'http-status';
import type { Request, Response, NextFunction } from 'express';
import { Course } from '@/schema/course';
import { Module } from '@/schema/module';
import { Lesson } from '@/schema/lesson';

/**
 * List published courses (public)
 */
export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, perPage = 30, category, level, minPrice, maxPrice, search } = req.query;

    const result: any = await (Course as any).list({
      page: Number(page),
      perPage: Number(perPage),
      category,
      level,
      isPublished: true, // Only published courses
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      search,
    });

    // Transform to public-safe fields only
    const publicCourses = result.courses.map((course: any) => {
      const transformed = course.transform();
      // Remove sensitive fields
      delete transformed.sales;
      delete transformed.internalNotes;
      delete transformed.tags_internal;
      delete transformed.coupons;
      delete transformed.gradingPolicy;
      return transformed;
    });

    res.json({
      status: httpStatus.OK,
      message: 'Courses retrieved successfully',
      data: publicCourses,
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
 * Get single course by slug or ID (public)
 */
export const get = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    let course;

    // Try to get by ID first, then by slug
    try {
      course = await (Course as any).get(slug);
    } catch (error) {
      course = await (Course as any).getBySlug(slug);
    }

    // Verify course is published
    if (!course.isPublished) {
      return res.status(httpStatus.NOT_FOUND).json({
        status: httpStatus.NOT_FOUND,
        message: 'Course not found',
      });
    }

    // Transform and remove sensitive data
    const transformed = course.transform();
    delete transformed.sales;
    delete transformed.internalNotes;
    delete transformed.tags_internal;
    delete transformed.coupons;
    delete transformed.gradingPolicy;

    // Get accurate published module stats (excluding drafts)
    const moduleStats = await (Course as any).getPublishedModuleStats(course._id);

    res.json({
      status: httpStatus.OK,
      message: 'Course retrieved successfully',
      data: {
        ...transformed,
        moduleStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get course curriculum/structure (public preview)
 */
export const getCurriculum = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    let course;

    // Get course
    try {
      course = await (Course as any).get(slug);
    } catch (error) {
      course = await (Course as any).getBySlug(slug);
    }

    // Verify course is published
    if (!course.isPublished) {
      return res.status(httpStatus.NOT_FOUND).json({
        status: httpStatus.NOT_FOUND,
        message: 'Course not found',
      });
    }

    // Get published modules for this course
    const modulesResult: any = await (Module as any).list({
      course: course._id,
      isPublished: true,
      perPage: 100, // Get all modules
    });

    // For each module, get published lessons (titles only)
    const curriculum = await Promise.all(
      modulesResult.modules.map(async (module: any) => {
        const lessonsResult: any = await (Lesson as any).list({
          module: module._id,
          isPublished: true,
          perPage: 100, // Get all lessons
        });

        return {
          id: module._id,
          title: module.title,
          description: module.description,
          order: module.order,
          lessonCount: lessonsResult.lessons.length,
          lessons: lessonsResult.lessons.map((lesson: any) => ({
            id: lesson._id,
            title: lesson.title,
            type: lesson.type,
            duration: lesson.duration,
            order: lesson.order,
          })),
        };
      })
    );

    res.json({
      status: httpStatus.OK,
      message: 'Course curriculum retrieved successfully',
      data: {
        courseId: course._id,
        courseTitle: course.title,
        modules: curriculum,
      },
    });
  } catch (error) {
    next(error);
  }
};

export default { list, get, getCurriculum };
