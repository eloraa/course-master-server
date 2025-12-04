import express from 'express';
import courseRoutes from './course.route';
import contentRoutes from './content.route';
import profileRoutes from './profile.route';
import quizRoutes from './quiz.route';
import assignmentRoutes from './assignment.route';

const router = express.Router();

/**
 * Student profile routes (/me/dashboard, /me/progress)
 */
router.use('/', profileRoutes);

/**
 * Student course routes (/me/courses)
 */
router.use('/courses', courseRoutes);

/**
 * Student content routes (/me/courses/:courseId/modules, etc.)
 */
router.use('/courses', contentRoutes);

/**
 * Student quiz routes (/me/quizzes, /me/courses/:courseId/quizzes)
 */
router.use('/', quizRoutes);
router.use('/courses', quizRoutes);

/**
 * Student assignment routes (/me/assignments, /me/courses/:courseId/assignments)
 */
router.use('/', assignmentRoutes);
router.use('/courses', assignmentRoutes);

export default router;
