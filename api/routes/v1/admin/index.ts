import express from 'express';
import courseRoutes from './course.route';
import quizRoutes from './quiz.route';
import moduleRoutes from './module.route';
import lessonRoutes from './lesson.route';

const router = express.Router();

/**
 * Admin course routes
 */
router.use('/courses', courseRoutes);

/**
 * Admin quiz routes
 */
router.use('/quizzes', quizRoutes);

/**
 * Admin module routes
 */
router.use('/modules', moduleRoutes);

/**
 * Admin lesson routes
 */
router.use('/lessons', lessonRoutes);

export default router;
