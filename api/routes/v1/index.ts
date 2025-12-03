import express from 'express';
import authRoutes from './auth.route';
import adminRoutes from './admin';
import orderRoutes from './order.route';
import { authorize, isAdmin } from '@/api/middlewares/auth';

export const router = express.Router();

/**
 * GET v1/status
 */
router.get('/status', (_, res) => res.send('OK'));

/**
 * Auth routes
 */
router.use('/auth', authRoutes);

/**
 * Order routes (authenticated users)
 */
router.use('/orders', authorize, orderRoutes);

/**
 * Admin routes (admin only)
 */
router.use('/admin', authorize, isAdmin, adminRoutes);
