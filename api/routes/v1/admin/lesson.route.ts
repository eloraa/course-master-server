import { Router } from 'express';
import * as lessonController from '@/api/controllers/lesson.controller';
import { validate } from '@/api/middlewares/validate';
import { transformBody } from '@/api/middlewares/transform-body';
import { createLessonSchema, updateLessonSchema, getLessonSchema } from '@/api/validations/lesson.validation';

const router = Router();

/**
 * @route POST /admin/lessons
 * @desc Create a new lesson
 * @access Admin only
 */
router.post('/', transformBody, validate(createLessonSchema), lessonController.create);

/**
 * @route GET /admin/lessons
 * @desc Get all lessons with filters
 * @access Admin only
 */
router.get('/', lessonController.list);

/**
 * @route GET /admin/lessons/:id
 * @desc Get lesson by ID
 * @access Admin only
 */
router.get('/:id', validate(getLessonSchema), lessonController.get);

/**
 * @route PUT /admin/lessons/:id
 * @desc Update lesson
 * @access Admin only
 */
router.put('/:id', transformBody, validate(updateLessonSchema), lessonController.update);

/**
 * @route DELETE /admin/lessons/:id
 * @desc Delete lesson
 * @access Admin only
 */
router.delete('/:id', validate(getLessonSchema), lessonController.remove);

export default router;
