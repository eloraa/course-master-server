import { Router } from 'express';
import * as orderController from '@/api/controllers/order.controller';
import { validate } from '@/api/middlewares/validate';
import { transformBody } from '@/api/middlewares/transform-body';
import {
  createOrderSchema,
  updateOrderSchema,
  getOrderSchema,
  updateOrderStatusSchema,
  updatePaymentStatusSchema,
} from '@/api/validations/order.validation';

const router = Router();

/**
 * @route POST /admin/orders
 * @desc Create a new order
 * @access Admin only
 */
router.post('/', transformBody, validate(createOrderSchema), orderController.create);

/**
 * @route GET /admin/orders
 * @desc Get all orders with filters
 * @access Admin only
 */
router.get('/', orderController.list);

/**
 * @route GET /admin/orders/stats
 * @desc Get order statistics
 * @access Admin only
 */
router.get('/stats', orderController.getStats);

/**
 * @route GET /admin/orders/:id
 * @desc Get order by ID
 * @access Admin only
 */
router.get('/:id', validate(getOrderSchema), orderController.get);

/**
 * @route GET /admin/orders/number/:orderNumber
 * @desc Get order by order number
 * @access Admin only
 */
router.get('/number/:orderNumber', orderController.getByOrderNumber);

/**
 * @route PUT /admin/orders/:id
 * @desc Update order
 * @access Admin only
 */
router.put('/:id', transformBody, validate(updateOrderSchema), orderController.update);

/**
 * @route PATCH /admin/orders/:id/status
 * @desc Update order status
 * @access Admin only
 */
router.patch('/:id/status', transformBody, validate(updateOrderStatusSchema), orderController.updateStatus);

/**
 * @route PATCH /admin/orders/:id/payment
 * @desc Update payment status
 * @access Admin only
 */
router.patch('/:id/payment', transformBody, validate(updatePaymentStatusSchema), orderController.updatePaymentStatus);

/**
 * @route DELETE /admin/orders/:id
 * @desc Cancel order
 * @access Admin only
 */
router.delete('/:id', validate(getOrderSchema), orderController.remove);

export default router;
