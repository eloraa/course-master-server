import express from 'express';
import authRoutes from './auth.route';
import adminRoutes from './admin';

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
 * Admin routes
 */
router.use('/admin', adminRoutes);
