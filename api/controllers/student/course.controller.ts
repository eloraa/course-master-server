import httpStatus from 'http-status';
import type { Request, Response, NextFunction } from 'express';
import { User } from '@/schema/user';
import { Course } from '@/schema/course';
import { Batch } from '@/schema/batch';

/**
 * Get current user's enrolled courses
 */
export const getMyEnrolledCourses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;

    // Get user with populated enrolled courses
    const populatedUser: any = await User.findById(user._id)
      .populate('enrolledCourses.course', 'title slug shortDescription thumbnailUrl price duration level')
      .exec();

    // Combine enrolled courses with progress data
    const enrolledCoursesWithProgress = populatedUser.enrolledCourses.map((enrollment: any) => {
      // Find progress for this course
      const progress = populatedUser.progress.find(
        (p: any) => p.course.toString() === enrollment.course._id.toString()
      );

      return {
        course: enrollment.course,
        enrolledAt: enrollment.enrolledAt,
        batch: enrollment.batch,
        progress: progress
          ? {
              percentage: progress.percentage || 0,
              completedLessons: progress.completedLessons?.length || 0,
              lastAccessedAt: progress.lastAccessedAt,
            }
          : {
              percentage: 0,
              completedLessons: 0,
              lastAccessedAt: null,
            },
      };
    });

    res.json({
      status: httpStatus.OK,
      message: 'Enrolled courses retrieved successfully',
      data: enrolledCoursesWithProgress,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single enrolled course details
 */
export const getEnrolledCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { courseId } = req.params;

    // Verify enrollment
    const isEnrolled = user.enrolledCourses.some(
      (ec: any) => ec.course.toString() === courseId
    );

    if (!isEnrolled) {
      return res.status(httpStatus.FORBIDDEN).json({
        status: httpStatus.FORBIDDEN,
        message: 'Not enrolled in this course',
      });
    }

    // Get course details
    const course = await (Course as any).get(courseId);

    // Get progress for this course
    const userWithProgress: any = await User.findById(user._id).exec();
    const progress = userWithProgress.progress.find(
      (p: any) => p.course.toString() === courseId
    );

    // Get accurate published module stats (excluding drafts)
    const moduleStats = await (Course as any).getPublishedModuleStats(courseId);

    res.json({
      status: httpStatus.OK,
      message: 'Course retrieved successfully',
      data: {
        course: {
          ...course.transform(),
          moduleStats,
        },
        progress: progress
          ? {
              percentage: progress.percentage || 0,
              completedLessons: progress.completedLessons?.map((cl: any) => cl.lessonId) || [],
              lastAccessedAt: progress.lastAccessedAt,
            }
          : {
              percentage: 0,
              completedLessons: [],
              lastAccessedAt: null,
            },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Enroll in a course
 */
export const enrollInCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { courseId } = req.body;

    // Validate course exists and is published
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(httpStatus.NOT_FOUND).json({
        status: httpStatus.NOT_FOUND,
        message: 'Course not found',
      });
    }

    if (!course.isPublished) {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: httpStatus.BAD_REQUEST,
        message: 'Course is not available for enrollment',
      });
    }

    // Check if already enrolled
    const isEnrolled = user.enrolledCourses.some(
      (ec: any) => ec.course.toString() === courseId
    );

    if (isEnrolled) {
      return res.status(httpStatus.CONFLICT).json({
        status: httpStatus.CONFLICT,
        message: 'Already enrolled in this course',
      });
    }

    // Get the active batch for this course (latest batch that hasn't ended)
    const now = new Date();
    const activeBatch = await Batch.findOne({
      course: courseId,
      deletedAt: null,
      $or: [
        { endDate: { $gt: now } },
        { endDate: null }
      ]
    }).sort({ startDate: -1 });

    // Add enrollment with the active batch (if exists)
    user.enrolledCourses.push({
      course: courseId,
      batch: activeBatch?._id || null,
      enrolledAt: new Date(),
    });

    // Initialize progress
    user.progress.push({
      course: courseId,
      percentage: 0,
      completedLessons: [],
      lastAccessedAt: new Date(),
    });

    await user.save();

    // Get populated enrollment details
    const populatedUser = await User.findById(user._id)
      .populate('enrolledCourses.course', 'title slug shortDescription thumbnailUrl price duration level')
      .populate('enrolledCourses.batch', 'name startDate endDate')
      .exec();

    const enrollment = populatedUser.enrolledCourses[populatedUser.enrolledCourses.length - 1];

    res.status(httpStatus.CREATED).json({
      status: httpStatus.CREATED,
      message: 'Enrolled successfully',
      data: {
        course: enrollment.course,
        batch: enrollment.batch,
        enrolledAt: enrollment.enrolledAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get detailed progress for a course
 */
export const getCourseProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { courseId } = req.params;

    // Verify enrollment
    const isEnrolled = user.enrolledCourses.some(
      (ec: any) => ec.course.toString() === courseId
    );

    if (!isEnrolled) {
      return res.status(httpStatus.FORBIDDEN).json({
        status: httpStatus.FORBIDDEN,
        message: 'Not enrolled in this course',
      });
    }

    // Get progress
    const userWithProgress: any = await User.findById(user._id).exec();
    const progress = userWithProgress.progress.find(
      (p: any) => p.course.toString() === courseId
    );

    if (!progress) {
      return res.json({
        status: httpStatus.OK,
        message: 'Progress retrieved successfully',
        data: {
          course: courseId,
          percentage: 0,
          completedLessons: [],
          lastAccessedAt: null,
        },
      });
    }

    res.json({
      status: httpStatus.OK,
      message: 'Progress retrieved successfully',
      data: {
        course: progress.course,
        percentage: progress.percentage || 0,
        completedLessons: progress.completedLessons?.map((cl: any) => cl.lessonId) || [],
        lastAccessedAt: progress.lastAccessedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export default { getMyEnrolledCourses, getEnrolledCourse, getCourseProgress, enrollInCourse };
