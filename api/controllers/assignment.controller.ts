// @ts-nocheck
import httpStatus from 'http-status';
import type { Request, Response, NextFunction } from 'express';
import { Assignment } from '@/schema/assignment';
import { Course } from '@/schema/course';
import { Module } from '@/schema/module';
import { Lesson } from '@/schema/lesson';

/**
 * Create a new assignment
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

    // Validate module exists and belongs to course (if provided)
    if (req.body.module) {
      const module = await Module.findOne({ _id: req.body.module, course: req.body.course });
      if (!module) {
        return res.status(httpStatus.BAD_REQUEST).json({
          status: httpStatus.BAD_REQUEST,
          message: 'Validation failed',
          errors: [
            {
              field: 'module',
              message: 'Module not found or does not belong to specified course',
            },
          ],
        });
      }

      // Validate lesson exists and belongs to module (if module is provided)
      if (req.body.lesson) {
        const lesson = await Lesson.findOne({ _id: req.body.lesson, module: req.body.module });
        if (!lesson) {
          return res.status(httpStatus.BAD_REQUEST).json({
            status: httpStatus.BAD_REQUEST,
            message: 'Validation failed',
            errors: [
              {
                field: 'lesson',
                message: 'Lesson not found or does not belong to specified module',
              },
            ],
          });
        }
      }
    } else if (req.body.lesson) {
      // Lesson cannot be specified without a module
      return res.status(httpStatus.BAD_REQUEST).json({
        status: httpStatus.BAD_REQUEST,
        message: 'Validation failed',
        errors: [
          {
            field: 'lesson',
            message: 'Lesson cannot be specified without a module',
          },
        ],
      });
    }

    const assignment = new Assignment(req.body);
    const savedAssignment: any = await assignment.save();

    res.status(httpStatus.CREATED).json({
      status: httpStatus.CREATED,
      message: 'Assignment created successfully',
      data: savedAssignment.transform(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all assignments with pagination and filters
 */
export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, perPage = 30, course, module, isPublished } = req.query;

    const result: any = await (Assignment as any).list({
      page: Number(page),
      perPage: Number(perPage),
      course,
      module,
      isPublished: isPublished === 'true',
    });

    res.json({
      status: httpStatus.OK,
      message: 'Assignments retrieved successfully',
      data: result.assignments.map((assignment: any) => assignment.transform()),
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
 * Get assignment by ID
 */
export const get = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const assignment = await (Assignment as any).get(id);

    res.json({
      status: httpStatus.OK,
      message: 'Assignment retrieved successfully',
      data: assignment.transform(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update assignment
 */
export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const assignment = await (Assignment as any).get(id);

    // If course/module/lesson is being changed, validate them
    if (req.body.course && req.body.course.toString() !== assignment.course.toString()) {
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

    if (req.body.module) {
      const moduleId = req.body.module.toString();
      const courseId = req.body.course ? req.body.course.toString() : assignment.course.toString();
      const module = await Module.findOne({ _id: moduleId, course: courseId });
      if (!module) {
        return res.status(httpStatus.BAD_REQUEST).json({
          status: httpStatus.BAD_REQUEST,
          message: 'Validation failed',
          errors: [
            {
              field: 'module',
              message: 'Module not found or does not belong to specified course',
            },
          ],
        });
      }

      // Validate lesson exists and belongs to module (if module is provided)
      if (req.body.lesson) {
        const lessonId = req.body.lesson.toString();
        const moduleId = req.body.module.toString();
        const lesson = await Lesson.findOne({ _id: lessonId, module: moduleId });
        if (!lesson) {
          return res.status(httpStatus.BAD_REQUEST).json({
            status: httpStatus.BAD_REQUEST,
            message: 'Validation failed',
            errors: [
              {
                field: 'lesson',
                message: 'Lesson not found or does not belong to specified module',
              },
            ],
          });
        }
      }
    } else if (req.body.lesson) {
      // Lesson cannot be specified without a module
      return res.status(httpStatus.BAD_REQUEST).json({
        status: httpStatus.BAD_REQUEST,
        message: 'Validation failed',
        errors: [
          {
            field: 'lesson',
            message: 'Lesson cannot be specified without a module',
          },
        ],
      });
    }

    Object.assign(assignment, req.body);
    const updatedAssignment: any = await assignment.save();

    res.json({
      status: httpStatus.OK,
      message: 'Assignment updated successfully',
      data: updatedAssignment.transform(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete assignment
 */
export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const assignment = await (Assignment as any).get(id);

    await assignment.deleteOne();

    res.json({
      status: httpStatus.OK,
      message: 'Assignment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Publish assignment
 */
export const publish = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const assignment = await (Assignment as any).get(id);

    assignment.isPublished = true;
    const updatedAssignment: any = await assignment.save();

    res.json({
      status: httpStatus.OK,
      message: 'Assignment published successfully',
      data: updatedAssignment.transform(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Unpublish assignment
 */
export const unpublish = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const assignment = await (Assignment as any).get(id);

    assignment.isPublished = false;
    const updatedAssignment: any = await assignment.save();

    res.json({
      status: httpStatus.OK,
      message: 'Assignment unpublished successfully',
      data: updatedAssignment.transform(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get assignment submissions (for grading)
 */
export const getSubmissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { page = 1, perPage = 30, status } = req.query;

    // Get the assignment first
    const assignment = await (Assignment as any).get(id);

    // Get user assignments for this assignment
    const User = (await import('@/schema/user')).User;
    const options: any = { 'assignments.assignment': id };

    if (status) {
      options['assignments.$.status'] = status;
    }

    const users = await User.find(options)
      .select('name email assignments')
      .exec();

    // Filter and format submissions
    const submissions = users
      .map((user: any) => {
        const userAssignment = user.assignments.find((a: any) => a.assignment.toString() === id);
        return userAssignment ? {
          id: userAssignment._id,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
          },
          assignment: userAssignment.assignment,
          status: userAssignment.status,
          submittedAt: userAssignment.submittedAt,
          score: userAssignment.score,
          feedback: userAssignment.feedback,
          gradedAt: userAssignment.gradedAt,
          gradedBy: userAssignment.gradedBy,
        } : null;
      })
      .filter(Boolean);

    const startIndex = (Number(page) - 1) * Number(perPage);
    const endIndex = startIndex + Number(perPage);
    const paginatedSubmissions = submissions.slice(startIndex, endIndex);

    res.json({
      status: httpStatus.OK,
      message: 'Assignment submissions retrieved successfully',
      data: {
        assignment: assignment.transform(),
        submissions: paginatedSubmissions,
        pagination: {
          page: Number(page),
          perPage: Number(perPage),
          total: submissions.length,
          totalPages: Math.ceil(submissions.length / Number(perPage)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Grade assignment submission
 */
export const gradeSubmission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { assignmentId, submissionId } = req.params;
    const { score, feedback } = req.body;

    const adminUser = (req as any).user;

    // Validate assignment exists
    const assignment = await (Assignment as any).get(assignmentId);

    // Validate score
    if (score < 0 || score > assignment.maxScore) {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: httpStatus.BAD_REQUEST,
        message: 'Validation failed',
        errors: [
          {
            field: 'score',
            message: `Score must be between 0 and ${assignment.maxScore}`,
          },
        ],
      });
    }

    // Find and update user's assignment submission
    const User = (await import('@/schema/user')).User;
    const user = await User.findOne({ 'assignments._id': submissionId });

    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({
        status: httpStatus.NOT_FOUND,
        message: 'Submission not found',
      });
    }

    // Find the specific assignment submission
    const assignmentSubmission = user.assignments.id(submissionId);
    if (!assignmentSubmission) {
      return res.status(httpStatus.NOT_FOUND).json({
        status: httpStatus.NOT_FOUND,
        message: 'Assignment submission not found',
      });
    }

    // Update the submission
    assignmentSubmission.score = Number(score);
    assignmentSubmission.feedback = feedback || '';
    assignmentSubmission.status = 'graded';
    assignmentSubmission.gradedAt = new Date();
    assignmentSubmission.gradedBy = adminUser._id;

    await user.save();

    // Return the updated submission
    const updatedSubmission = {
      id: assignmentSubmission._id,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      assignment: assignmentSubmission.assignment,
      status: assignmentSubmission.status,
      submittedAt: assignmentSubmission.submittedAt,
      score: assignmentSubmission.score,
      feedback: assignmentSubmission.feedback,
      gradedAt: assignmentSubmission.gradedAt,
      gradedBy: adminUser.name,
    };

    res.json({
      status: httpStatus.OK,
      message: 'Assignment graded successfully',
      data: updatedSubmission,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get assignments by course
 */
export const getByCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId } = req.params;
    const { page = 1, perPage = 30, module, isPublished } = req.query;

    const result: any = await (Assignment as any).list({
      page: Number(page),
      perPage: Number(perPage),
      course: courseId,
      module,
      isPublished: isPublished === 'true',
    });

    res.json({
      status: httpStatus.OK,
      message: 'Course assignments retrieved successfully',
      data: result.assignments.map((assignment: any) => assignment.transform()),
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

export default {
  create,
  list,
  get,
  update,
  remove,
  publish,
  unpublish,
  getSubmissions,
  gradeSubmission,
  getByCourse,
};