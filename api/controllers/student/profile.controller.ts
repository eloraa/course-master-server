import httpStatus from 'http-status';
import type { Request, Response, NextFunction } from 'express';
import { User } from '@/schema/user';

/**
 * Get student dashboard data
 */
export const getDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;

    // Get user with populated data
    const populatedUser: any = await User.findById(user._id)
      .populate('enrolledCourses.course', 'title slug thumbnailUrl')
      .exec();

    // Calculate dashboard stats
    const enrolledCoursesCount = populatedUser.enrolledCourses.length;

    // Calculate overall progress
    const totalProgress = populatedUser.progress.reduce((sum: number, p: any) => sum + (p.percentage || 0), 0);
    const averageProgress = enrolledCoursesCount > 0 ? totalProgress / enrolledCoursesCount : 0;

    // Get total completed lessons
    const totalCompletedLessons = populatedUser.progress.reduce(
      (sum: number, p: any) => sum + (p.completedLessons?.length || 0),
      0
    );

    // Get recent activity (last 5 accessed courses)
    const recentActivity = populatedUser.progress
      .filter((p: any) => p.lastAccessedAt)
      .sort((a: any, b: any) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime())
      .slice(0, 5)
      .map((p: any) => {
        const enrollment = populatedUser.enrolledCourses.find(
          (ec: any) => ec.course._id.toString() === p.course.toString()
        );
        return {
          course: enrollment?.course,
          lastAccessedAt: p.lastAccessedAt,
          percentage: p.percentage || 0,
        };
      });

    // Get courses in progress (0% < progress < 100%)
    const inProgressCourses = populatedUser.progress.filter(
      (p: any) => p.percentage > 0 && p.percentage < 100
    ).length;

    // Get completed courses (100% progress)
    const completedCourses = populatedUser.progress.filter((p: any) => p.percentage === 100).length;

    res.json({
      status: httpStatus.OK,
      message: 'Dashboard data retrieved successfully',
      data: {
        enrolledCoursesCount,
        inProgressCourses,
        completedCourses,
        averageProgress: Math.round(averageProgress * 100) / 100,
        totalCompletedLessons,
        recentActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get overall progress across all courses
 */
export const getOverallProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;

    // Get user with populated data
    const populatedUser: any = await User.findById(user._id)
      .populate('enrolledCourses.course', 'title slug thumbnailUrl duration')
      .exec();

    // Map progress with course details
    const progressData = populatedUser.enrolledCourses.map((enrollment: any) => {
      const progress = populatedUser.progress.find(
        (p: any) => p.course.toString() === enrollment.course._id.toString()
      );

      return {
        course: enrollment.course,
        enrolledAt: enrollment.enrolledAt,
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

    // Calculate totals
    const totalLessonsCompleted = populatedUser.progress.reduce(
      (sum: number, p: any) => sum + (p.completedLessons?.length || 0),
      0
    );

    const totalProgress = populatedUser.progress.reduce(
      (sum: number, p: any) => sum + (p.percentage || 0),
      0
    );

    const averageProgress =
      populatedUser.enrolledCourses.length > 0 ? totalProgress / populatedUser.enrolledCourses.length : 0;

    res.json({
      status: httpStatus.OK,
      message: 'Overall progress retrieved successfully',
      data: {
        courses: progressData,
        summary: {
          totalCoursesEnrolled: populatedUser.enrolledCourses.length,
          totalLessonsCompleted,
          averageProgress: Math.round(averageProgress * 100) / 100,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user session/profile
 */
export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;

    // Get full user data
    const userDoc: any = await User.findById(user._id)
      .populate('enrolledCourses.course', 'title slug')
      .select('-password') // Exclude password from response
      .exec();

    if (!userDoc) {
      return res.status(httpStatus.NOT_FOUND).json({
        status: httpStatus.NOT_FOUND,
        message: 'User not found',
      });
    }

    res.json({
      status: httpStatus.OK,
      message: 'User profile retrieved successfully',
      data: {
        id: userDoc._id,
        name: userDoc.name,
        email: userDoc.email,
        role: userDoc.role,
        enrolledCoursesCount: userDoc.enrolledCourses.length,
        createdAt: userDoc.createdAt,
        updatedAt: userDoc.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export default { getDashboard, getOverallProgress, getMe };
