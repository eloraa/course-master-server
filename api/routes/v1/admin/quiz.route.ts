import { Router } from 'express';
import * as quizController from '@/api/controllers/quiz.controller';
import { validate } from '@/api/middlewares/validate';
import { transformBody } from '@/api/middlewares/transform-body';
import { createQuizSchema, updateQuizSchema, getQuizSchema } from '@/api/validations/quiz.validation';

const router = Router();

/**
 * @route POST /admin/quizzes
 * @desc Create a new quiz
 * @access Admin only
 */
router.post('/', transformBody, validate(createQuizSchema), quizController.create);

/**
 * @route GET /admin/quizzes
 * @desc Get all quizzes with filters
 * @access Admin only
 */
router.get('/', quizController.list);

/**
 * @route GET /admin/quizzes/:id
 * @desc Get quiz by ID
 * @access Admin only
 */
router.get('/:id', validate(getQuizSchema), quizController.get);

/**
 * @route PUT /admin/quizzes/:id
 * @desc Update quiz
 * @access Admin only
 */
router.put('/:id', transformBody, validate(updateQuizSchema), quizController.update);

/**
 * @route DELETE /admin/quizzes/:id
 * @desc Delete quiz
 * @access Admin only
 */
router.delete('/:id', validate(getQuizSchema), quizController.remove);

export default router;
