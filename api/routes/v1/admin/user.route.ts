import { Router } from 'express';
import * as userController from '@/api/controllers/user.controller';

const router = Router();

/**
 * @route GET /admin/users/stats
 * @desc Get user statistics
 * @access Admin only
 */
router.get('/stats', userController.getStats);

export default router;
