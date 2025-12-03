import { Router } from 'express';
import * as orderController from '@/api/controllers/order.controller';
import { validate } from '@/api/middlewares/validate';
import { transformBody } from '@/api/middlewares/transform-body';
import { createOrderSchema, getOrderSchema } from '@/api/validations/order.validation';

const router = Router();

/**
 * @route POST /orders
 * @desc Create a new order (user purchases courses)
 * @access Authenticated users
 */
router.post('/', transformBody, validate(createOrderSchema), orderController.create);

/**
 * @route GET /orders
 * @desc Get current user's orders
 * @access Authenticated users
 */
router.get('/', orderController.getMyOrders);

/**
 * @route GET /orders/:id
 * @desc Get order by ID (only user's own orders)
 * @access Authenticated users
 */
router.get('/:id', validate(getOrderSchema), orderController.get);

/**
 * @route GET /orders/number/:orderNumber
 * @desc Get order by order number (only user's own orders)
 * @access Authenticated users
 */
router.get('/number/:orderNumber', orderController.getByOrderNumber);

export default router;
