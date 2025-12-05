import httpStatus from 'http-status';
import type { Request, Response, NextFunction } from 'express';
import { Quiz } from '@/schema/quiz';

/**
 * Create a new quiz
 */
export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;

    req.body.createdBy = user._id;

    const quiz = new Quiz(req.body);
    const savedQuiz: any = await quiz.save();

    res.status(httpStatus.CREATED).json({
      status: httpStatus.CREATED,
      message: 'Quiz created successfully',
      data: savedQuiz.transform(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all quizzes with pagination and filters
 */
export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, perPage = 30, course, module, isPublished, type } = req.query;

    const listOptions: any = {
      page: Number(page),
      perPage: Number(perPage),
      course,
      module,
      type,
    };

    // Only filter by isPublished if explicitly provided
    if (isPublished !== undefined) {
      listOptions.isPublished = isPublished === 'true';
    }

    const result: any = await (Quiz as any).list(listOptions);

    res.json({
      status: httpStatus.OK,
      message: 'Quizzes retrieved successfully',
      data: result.quizzes.map((quiz: any) => quiz.transform()),
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
 * Get quiz by ID
 */
export const get = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const quiz = await (Quiz as any).get(id);

    res.json({
      status: httpStatus.OK,
      message: 'Quiz retrieved successfully',
      data: quiz.transform(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update quiz
 */
export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const quiz = await (Quiz as any).get(id);

    Object.assign(quiz, req.body);
    const updatedQuiz: any = await quiz.save();

    res.json({
      status: httpStatus.OK,
      message: 'Quiz updated successfully',
      data: updatedQuiz.transform(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Publish/unpublish quiz
 */
export const publish = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const quiz = await (Quiz as any).get(id);

    quiz.isPublished = !quiz.isPublished;
    const updatedQuiz: any = await quiz.save();

    res.json({
      status: httpStatus.OK,
      message: `Quiz ${updatedQuiz.isPublished ? 'published' : 'unpublished'} successfully`,
      data: updatedQuiz.transform(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete quiz
 */
export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const quiz = await (Quiz as any).get(id);

    await quiz.deleteOne();

    res.json({
      status: httpStatus.OK,
      message: 'Quiz deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get quiz statistics
 */
export const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { quizId, courseId, startDate, endDate } = req.query;

    const stats = await (Quiz as any).getStats({
      quizId,
      courseId,
      startDate,
      endDate,
    });

    res.json({
      status: httpStatus.OK,
      message: 'Quiz statistics retrieved successfully',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export default { create, list, get, update, remove, getStats };
