import { Router } from 'express';
import * as quizController from '@/api/controllers/student/quiz.controller';
import { validate } from '@/api/middlewares/validate';
import { transformBody } from '@/api/middlewares/transform-body';
import {
  getQuizSchema,
  submitQuizSchema,
  getQuizResultsSchema,
  getMyQuizzesSchema,
} from '@/api/validations/quiz-submission.validation';

const router = Router();

/**
 * @route GET /me/quizzes
 * @desc Get all user's quiz submissions
 * @access Authenticated
 */
router.get('/', validate(getMyQuizzesSchema), quizController.getMyQuizzes);

/**
 * @route GET /me/courses/:courseId/quizzes/:quizId
 * @desc Get quiz for taking
 * @access Authenticated
 */
router.get('/:courseId/quizzes/:quizId', validate(getQuizSchema), quizController.getQuiz);

/**
 * @route POST /me/courses/:courseId/quizzes/:quizId/submit
 * @desc Submit quiz answers
 * @access Authenticated
 */
router.post(
  '/:courseId/quizzes/:quizId/submit',
  transformBody,
  quizController.submitQuiz
);

/**
 * @route GET /me/courses/:courseId/quizzes/:quizId/results
 * @desc Get quiz results
 * @access Authenticated
 */
router.get(
  '/:courseId/quizzes/:quizId/results',
  validate(getQuizResultsSchema),
  quizController.getQuizResults
);

export default router;
