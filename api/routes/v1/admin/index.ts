import express from 'express';
import courseRoutes from './course.route';
import quizRoutes from './quiz.route';

const router = express.Router();

/**
 * Admin course routes
 */
router.use('/courses', courseRoutes);

/**
 * Admin quiz routes
 */
router.use('/quizzes', quizRoutes);

export default router;
