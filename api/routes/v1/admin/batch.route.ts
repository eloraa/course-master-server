import express from 'express';
import controller from '@/api/controllers/batch.controller';
import { validate } from '@/api/middlewares/validate';
import { transformBody } from '@/api/middlewares/transform-body';

const router = express.Router();

/**
 * @route   POST /v1/admin/batches
 * @desc    Create a new batch
 * @access  Admin
 */
router.route('/').post(transformBody, controller.create);

/**
 * @route   GET /v1/admin/batches
 * @desc    Get all batches with filters
 * @access  Admin
 */
router.route('/').get(controller.list);

/**
 * @route   GET /v1/admin/batches/stats
 * @desc    Get batch statistics
 * @access  Admin
 */
router.route('/stats').get(controller.getStats);

/**
 * @route   GET /v1/admin/batches/courses/:courseId
 * @desc    Get batches by course
 * @access  Admin
 */
router.route('/courses/:courseId').get(controller.getByCourse);

/**
 * @route   PATCH /v1/admin/batches/:id/publish
 * @desc    Publish a batch
 * @access  Admin
 */
router.route('/:id/publish').patch(controller.publish);

/**
 * @route   PATCH /v1/admin/batches/:id/unpublish
 * @desc    Unpublish a batch
 * @access  Admin
 */
router.route('/:id/unpublish').patch(controller.unpublish);

/**
 * @route   PATCH /v1/admin/batches/:id/status
 * @desc    Update batch status
 * @access  Admin
 */
router.route('/:id/status').patch(controller.updateStatus);

/**
 * @route   GET /v1/admin/batches/:id
 * @desc    Get batch by ID
 * @access  Admin
 */
router.route('/:id').get(controller.get);

/**
 * @route   PUT /v1/admin/batches/:id
 * @desc    Update a batch
 * @access  Admin
 */
router.route('/:id').put(transformBody, controller.update);

/**
 * @route   DELETE /v1/admin/batches/:id
 * @desc    Delete a batch
 * @access  Admin
 */
router.route('/:id').delete(controller.remove);

export default router;