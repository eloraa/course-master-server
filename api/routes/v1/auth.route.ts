import express from 'express';
import controller from '../../controllers/auth.controller';
import { registerSchema, loginSchema, refreshSchema } from '@/api/validations/auth.validation';
import { validate } from '@/api/middlewares/validate';

const router = express.Router();

/**
 * @route   POST /v1/auth/register
 * @desc    Register a new user
 * @access  Public (students) / Admin (for admin accounts)
 */
router.route('/register').post(validate(registerSchema), controller.register);

/**
 * @route   POST /v1/auth/login
 * @desc    Login user and get token
 * @access  Public
 */
router.route('/login').post(validate(loginSchema), controller.login);

/**
 * @route   POST /v1/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.route('/refresh-token').post(validate(refreshSchema), controller.refresh);

export default router;
