import express from 'express';
import controller from '@/api/controllers/course.controller';
import { createCourseSchema, updateCourseSchema, getCourseSchema } from '@/api/validations/course.validation';
import { validate } from '@/api/middlewares/validate';
import { transformBody } from '@/api/middlewares/transform-body';

const router = express.Router();

/**
 * @route   POST /v1/admin/courses
 * @desc    Create a new course
 * @access  Admin
 */
router.route('/').post(transformBody, validate(createCourseSchema), controller.create);

/**
 * @route   GET /v1/admin/courses
 * @desc    Get all courses (with filters)
 * @access  Admin
 */
router.route('/').get(controller.list);

/**
 * @route   GET /v1/admin/courses/stats
 * @desc    Get course statistics
 * @access  Admin
 */
router.route('/stats').get(controller.getStats);

/**
 * @route   PATCH /v1/admin/courses/:id/publish
 * @desc    Publish a course
 * @access  Admin
 */
router.route('/:id/publish').patch(validate(getCourseSchema), controller.publish);

/**
 * @route   PATCH /v1/admin/courses/:id/unpublish
 * @desc    Unpublish a course
 * @access  Admin
 */
router.route('/:id/unpublish').patch(validate(getCourseSchema), controller.unpublish);

/**
 * @route   PATCH /v1/admin/courses/:id/visibility
 * @desc    Update course visibility
 * @access  Admin
 */
router.route('/:id/visibility').patch(validate(getCourseSchema), controller.updateVisibility);

/**
 * @route   GET /v1/admin/courses/:id
 * @desc    Get course by ID or slug
 * @access  Admin
 */
router.route('/:id').get(validate(getCourseSchema), controller.get);

/**
 * @route   PUT /v1/admin/courses/:id
 * @desc    Update a course
 * @access  Admin
 */
router.route('/:id').put(transformBody, validate(updateCourseSchema), controller.update);

/**
 * @route   DELETE /v1/admin/courses/:id
 * @desc    Delete a course
 * @access  Admin
 */
router.route('/:id').delete(validate(getCourseSchema), controller.remove);

export default router;
