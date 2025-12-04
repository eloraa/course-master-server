import httpStatus from 'http-status';
import type { Request, Response, NextFunction } from 'express';
import { User } from '@/schema/user';
import { Module } from '@/schema/module';
import { Lesson } from '@/schema/lesson';

/**
 * Verify user is enrolled in a course
 */
const verifyEnrollment = (user: any, courseId: string): boolean => {
  return user.enrolledCourses.some((ec: any) => ec.course.toString() === courseId);
};

/**
 * Get modules for enrolled course
 */
export const getCourseModules = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { courseId } = req.params;

    // Verify enrollment
    if (!verifyEnrollment(user, courseId)) {
      return res.status(httpStatus.FORBIDDEN).json({
        status: httpStatus.FORBIDDEN,
        message: 'Not enrolled in this course',
      });
    }

    // Get published modules
    const result: any = await (Module as any).list({
      course: courseId,
      isPublished: true,
      perPage: 100,
    });

    res.json({
      status: httpStatus.OK,
      message: 'Modules retrieved successfully',
      data: result.modules.map((module: any) => module.transform()),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get lessons for a module
 */
export const getModuleLessons = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { courseId, moduleId } = req.params;

    // Verify enrollment
    if (!verifyEnrollment(user, courseId)) {
      return res.status(httpStatus.FORBIDDEN).json({
        status: httpStatus.FORBIDDEN,
        message: 'Not enrolled in this course',
      });
    }

    // Get published lessons
    const result: any = await (Lesson as any).list({
      module: moduleId,
      isPublished: true,
      perPage: 100,
    });

    res.json({
      status: httpStatus.OK,
      message: 'Lessons retrieved successfully',
      data: result.lessons.map((lesson: any) => lesson.transform()),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get full lesson content
 */
export const getLesson = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { courseId, lessonId } = req.params;

    // Verify enrollment
    if (!verifyEnrollment(user, courseId)) {
      return res.status(httpStatus.FORBIDDEN).json({
        status: httpStatus.FORBIDDEN,
        message: 'Not enrolled in this course',
      });
    }

    // Get lesson with populated references
    const lesson = await (Lesson as any).get(lessonId);

    // Verify lesson belongs to the course
    if (lesson.course.toString() !== courseId) {
      return res.status(httpStatus.FORBIDDEN).json({
        status: httpStatus.FORBIDDEN,
        message: 'Lesson does not belong to this course',
      });
    }

    // Verify lesson is published
    if (!lesson.isPublished) {
      return res.status(httpStatus.NOT_FOUND).json({
        status: httpStatus.NOT_FOUND,
        message: 'Lesson not found',
      });
    }

    res.json({
      status: httpStatus.OK,
      message: 'Lesson retrieved successfully',
      data: lesson.transform(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark lesson as completed
 */
export const markLessonComplete = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { courseId, lessonId } = req.params;

    // Verify enrollment
    if (!verifyEnrollment(user, courseId)) {
      return res.status(httpStatus.FORBIDDEN).json({
        status: httpStatus.FORBIDDEN,
        message: 'Not enrolled in this course',
      });
    }

    // Get lesson to verify it exists and belongs to course
    const lesson = await (Lesson as any).get(lessonId);

    if (lesson.course.toString() !== courseId) {
      return res.status(httpStatus.FORBIDDEN).json({
        status: httpStatus.FORBIDDEN,
        message: 'Lesson does not belong to this course',
      });
    }

    // Get user with progress
    const userDoc: any = await User.findById(user._id).exec();

    // Find or create progress entry for this course
    let progressEntry = userDoc.progress.find((p: any) => p.course.toString() === courseId);

    if (!progressEntry) {
      // Create new progress entry
      progressEntry = {
        course: courseId,
        completedLessons: [],
        percentage: 0,
        lastAccessedAt: new Date(),
      };
      userDoc.progress.push(progressEntry);
    }

    // Add lesson to completed lessons if not already completed
    if (!progressEntry.completedLessons.includes(lessonId)) {
      progressEntry.completedLessons.push(lessonId);
    }

    // Update last accessed time
    progressEntry.lastAccessedAt = new Date();

    // Recalculate progress percentage
    const totalLessons = await Lesson.countDocuments({
      course: courseId,
      isPublished: true,
    });

    progressEntry.percentage = totalLessons > 0 ? (progressEntry.completedLessons.length / totalLessons) * 100 : 0;

    // Save user
    await userDoc.save();

    res.json({
      status: httpStatus.OK,
      message: 'Lesson marked as completed',
      data: {
        course: courseId,
        lesson: lessonId,
        progress: {
          percentage: progressEntry.percentage,
          completedLessons: progressEntry.completedLessons.length,
          totalLessons,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export default { getCourseModules, getModuleLessons, getLesson, markLessonComplete };
