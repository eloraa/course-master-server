import httpStatus from 'http-status';
import type { Request, Response, NextFunction } from 'express';
import { Lesson } from '@/schema/lesson';
import { Module } from '@/schema/module';
import { Quiz } from '@/schema/quiz';
import { Assignment } from '@/schema/assignment';

/**
 * Create a new lesson
 */
export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;

    req.body.createdBy = user._id;

    const lesson = new Lesson(req.body);
    const savedLesson: any = await lesson.save();

    // Update module's lesson count
    if (req.body.module) {
      await Module.findByIdAndUpdate(req.body.module, {
        $inc: { lessonCount: 1 },
      });
    }

    // If lesson is created as published, also publish its associated quiz or assignment
    if (savedLesson.isPublished) {
      if (savedLesson.type === 'quiz' && savedLesson.quiz) {
        await (Quiz as any).findByIdAndUpdate(savedLesson.quiz, { isPublished: true });
      } else if (savedLesson.type === 'assignment' && savedLesson.assignment) {
        await (Assignment as any).findByIdAndUpdate(savedLesson.assignment, { isPublished: true });
      }
    }

    res.status(httpStatus.CREATED).json({
      status: httpStatus.CREATED,
      message: 'Lesson created successfully',
      data: savedLesson.transform(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all lessons with pagination and filters
 */
export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, perPage = 30, course, module, type, isPublished } = req.query;

    const listOptions: any = {
      page: Number(page),
      perPage: Number(perPage),
      course,
      module,
      type,
    };

    // Only include isPublished if explicitly provided
    if (isPublished !== undefined) {
      listOptions.isPublished = isPublished === 'true';
    }

    const result: any = await (Lesson as any).list(listOptions);

    res.json({
      status: httpStatus.OK,
      message: 'Lessons retrieved successfully',
      data: result.lessons.map((lesson: any) => lesson.transform()),
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
 * Get lesson by ID
 */
export const get = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const lesson = await (Lesson as any).get(id);

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
 * Update lesson
 */
export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const lesson = await (Lesson as any).get(id);

    // Store the old publish state before updating
    const wasPublished = lesson.isPublished;

    // Update the lesson
    Object.assign(lesson, req.body);
    const updatedLesson: any = await lesson.save();

    // Sync quiz/assignment publication status with lesson
    const isNowPublished = updatedLesson.isPublished;

    // If lesson is published, make sure quiz/assignment is also published
    if (isNowPublished) {
      if (updatedLesson.type === 'quiz' && updatedLesson.quiz) {
        await (Quiz as any).findByIdAndUpdate(updatedLesson.quiz, { isPublished: true });
      } else if (updatedLesson.type === 'assignment' && updatedLesson.assignment) {
        await (Assignment as any).findByIdAndUpdate(updatedLesson.assignment, { isPublished: true });
      }
    } else {
      // If lesson is unpublished, unpublish quiz/assignment as well
      if (updatedLesson.type === 'quiz' && updatedLesson.quiz) {
        await (Quiz as any).findByIdAndUpdate(updatedLesson.quiz, { isPublished: false });
      } else if (updatedLesson.type === 'assignment' && updatedLesson.assignment) {
        await (Assignment as any).findByIdAndUpdate(updatedLesson.assignment, { isPublished: false });
      }
    }

    res.json({
      status: httpStatus.OK,
      message: 'Lesson updated successfully',
      data: updatedLesson.transform(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete lesson
 */
export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const lesson = await (Lesson as any).get(id);

    const moduleId = lesson.module;

    await lesson.deleteOne();

    // Update module's lesson count
    if (moduleId) {
      await Module.findByIdAndUpdate(moduleId, {
        $inc: { lessonCount: -1 },
      });
    }

    res.json({
      status: httpStatus.OK,
      message: 'Lesson deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export default { create, list, get, update, remove };
