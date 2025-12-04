import { Router } from 'express';
import * as profileController from '@/api/controllers/student/profile.controller';

const router = Router();

/**
 * @route GET /me
 * @desc Get current user session/profile
 * @access Authenticated
 */
router.get('/', profileController.getMe);

/**
 * @route GET /me/dashboard
 * @desc Get student dashboard
 * @access Authenticated
 */
router.get('/dashboard', profileController.getDashboard);

/**
 * @route GET /me/progress
 * @desc Get overall progress
 * @access Authenticated
 */
router.get('/progress', profileController.getOverallProgress);

export default router;
