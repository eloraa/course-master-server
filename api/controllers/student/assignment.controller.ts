import httpStatus from 'http-status';
import type { Request, Response, NextFunction } from 'express';
import moment from 'moment-timezone';
import { User } from '@/schema/user';
import { Assignment } from '@/schema/assignment';

const TIMEZONE = 'Asia/Dhaka';

/**
 * Get assignment details
 */
export const getAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { courseId, assignmentId } = req.params;

    // Verify enrollment
    const isEnrolled = user.enrolledCourses.some((ec: any) => ec.course.toString() === courseId);
    if (!isEnrolled) {
      return res.status(httpStatus.FORBIDDEN).json({
        status: httpStatus.FORBIDDEN,
        message: 'Not enrolled in this course',
      });
    }

    // Get assignment
    const assignment = await (Assignment as any).get(assignmentId);

    // Verify assignment belongs to course
    if (assignment.course._id.toString() !== courseId) {
      return res.status(httpStatus.FORBIDDEN).json({
        status: httpStatus.FORBIDDEN,
        message: 'Assignment does not belong to this course',
      });
    }

    // Verify assignment is published
    if (!assignment.isPublished) {
      return res.status(httpStatus.NOT_FOUND).json({
        status: httpStatus.NOT_FOUND,
        message: 'Assignment not found',
      });
    }

    // Get user's submission if exists
    const userDoc: any = await User.findById(user._id).exec();
    const submission = userDoc.assignments.find(
      (a: any) => a.assignment?.toString?.() === assignmentId
    );

    res.json({
      status: httpStatus.OK,
      message: 'Assignment retrieved successfully',
      data: {
        ...assignment.transform(),
        submission: submission
          ? {
              answer: submission.answer,
              submittedAt: submission.submittedAt,
              reviewed: submission.reviewed,
              grade: submission.grade,
              feedback: submission.feedback,
              isLate: submission.isLate,
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit assignment
 */
export const submitAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { courseId, assignmentId } = req.params;
    const { answer } = req.body;

    // Verify enrollment
    const isEnrolled = user.enrolledCourses.some((ec: any) => ec.course.toString() === courseId);
    if (!isEnrolled) {
      return res.status(httpStatus.FORBIDDEN).json({
        status: httpStatus.FORBIDDEN,
        message: 'Not enrolled in this course',
      });
    }

    // Get assignment
    const assignment = await (Assignment as any).get(assignmentId);

    // Verify assignment belongs to course
    if (assignment.course._id.toString() !== courseId) {
      return res.status(httpStatus.FORBIDDEN).json({
        status: httpStatus.FORBIDDEN,
        message: 'Assignment does not belong to this course',
      });
    }

    // Verify assignment is published
    if (!assignment.isPublished) {
      return res.status(httpStatus.NOT_FOUND).json({
        status: httpStatus.NOT_FOUND,
        message: 'Assignment not found',
      });
    }

    // Check due date (convert to Bangladesh timezone)
    const now = moment().tz(TIMEZONE);
    let isLate = false;

    if (assignment.dueDate && moment(assignment.dueDate).tz(TIMEZONE).isBefore(now)) {
      if (!assignment.allowLateSubmission) {
        return res.status(httpStatus.FORBIDDEN).json({
          status: httpStatus.FORBIDDEN,
          message: 'Assignment deadline has passed',
        });
      }
      isLate = true;
    }

    // Get user
    const userDoc: any = await User.findById(user._id).exec();

    // Check if already submitted
    const existingSubmissionIndex = userDoc.assignments.findIndex(
      (a: any) => a.assignment?.toString?.() === assignmentId
    );

    const submission = {
      assignment: assignmentId,
      course: courseId,
      module: assignment.module,
      answer,
      submittedAt: new Date(),
      reviewed: false,
      grade: null,
      isLate,
    };

    if (existingSubmissionIndex >= 0) {
      // Update existing submission
      userDoc.assignments[existingSubmissionIndex] = submission;
    } else {
      // Add new submission
      userDoc.assignments.push(submission);
    }

    await userDoc.save();

    // Calculate penalty if late
    let maxScore = assignment.maxScore;
    if (isLate && assignment.latePenalty) {
      maxScore = assignment.maxScore * (1 - assignment.latePenalty / 100);
    }

    res.json({
      status: httpStatus.CREATED,
      message: 'Assignment submitted successfully',
      data: {
        assignmentId,
        submittedAt: submission.submittedAt,
        isLate,
        maxScore,
        status: 'pending_review',
        note: isLate ? `Late submission. ${assignment.latePenalty}% penalty applied.` : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get assignment submission status
 */
export const getSubmissionStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { courseId, assignmentId } = req.params;

    // Verify enrollment
    const isEnrolled = user.enrolledCourses.some((ec: any) => ec.course.toString() === courseId);
    if (!isEnrolled) {
      return res.status(httpStatus.FORBIDDEN).json({
        status: httpStatus.FORBIDDEN,
        message: 'Not enrolled in this course',
      });
    }

    // Get user
    const userDoc: any = await User.findById(user._id).exec();

    // Find submission
    const submission = userDoc.assignments.find(
      (a: any) => a.assignment?.toString?.() === assignmentId
    );

    if (!submission) {
      return res.status(httpStatus.NOT_FOUND).json({
        status: httpStatus.NOT_FOUND,
        message: 'No submission found for this assignment',
      });
    }

    res.json({
      status: httpStatus.OK,
      message: 'Submission status retrieved successfully',
      data: {
        assignmentId,
        submitted: true,
        submittedAt: submission.submittedAt,
        reviewed: submission.reviewed,
        grade: submission.grade,
        feedback: submission.feedback,
        isLate: submission.isLate,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all user's assignments
 */
export const getMyAssignments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { courseId, page = 1, perPage = 30 } = req.query;

    // Get user
    const userDoc: any = await User.findById(user._id)
      .populate('assignments.assignment', 'title course dueDate maxScore')
      .exec();

    // Filter by course if provided
    let assignments = userDoc.assignments;
    if (courseId) {
      assignments = assignments.filter((a: any) => a.course?.toString?.() === courseId);
    }

    // Paginate
    const start = (Number(page) - 1) * Number(perPage);
    const paginatedAssignments = assignments.slice(start, start + Number(perPage));

    res.json({
      status: httpStatus.OK,
      message: 'Assignments retrieved successfully',
      data: paginatedAssignments.map((a: any) => ({
        assignment: a.assignment,
        course: a.course,
        submittedAt: a.submittedAt,
        reviewed: a.reviewed,
        grade: a.grade,
        isLate: a.isLate,
      })),
      pagination: {
        page: Number(page),
        perPage: Number(perPage),
        total: assignments.length,
        totalPages: Math.ceil(assignments.length / Number(perPage)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export default { getAssignment, submitAssignment, getSubmissionStatus, getMyAssignments };
