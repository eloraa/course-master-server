import express from 'express';
import courseRoutes from './course.route';

const router = express.Router();

/**
 * Admin course routes
 */
router.use('/courses', courseRoutes);

export default router;
