import express from 'express';
import controller from '@/api/controllers/assignment.controller';
import { validate } from '@/api/middlewares/validate';
import { transformBody } from '@/api/middlewares/transform-body';

const router = express.Router();

/**
 * @route   POST /v1/admin/assignments
 * @desc    Create a new assignment
 * @access  Admin
 */
router.route('/').post(transformBody, controller.create);

/**
 * @route   GET /v1/admin/assignments
 * @desc    Get all assignments with filters
 * @access  Admin
 */
router.route('/').get(controller.list);

/**
 * @route   GET /v1/admin/assignments/courses/:courseId
 * @desc    Get assignments by course
 * @access  Admin
 */
router.route('/courses/:courseId').get(controller.getByCourse);

/**
 * @route   PATCH /v1/admin/assignments/:id/publish
 * @desc    Publish an assignment
 * @access  Admin
 */
router.route('/:id/publish').patch(controller.publish);

/**
 * @route   PATCH /v1/admin/assignments/:id/unpublish
 * @desc    Unpublish an assignment
 * @access  Admin
 */
router.route('/:id/unpublish').patch(controller.unpublish);

/**
 * @route   GET /v1/admin/assignments/:id/submissions
 * @desc    Get assignment submissions for grading
 * @access  Admin
 */
router.route('/:id/submissions').get(controller.getSubmissions);

/**
 * @route   PATCH /v1/admin/assignments/:assignmentId/submissions/:submissionId/grade
 * @desc    Grade assignment submission
 * @access  Admin
 */
router.route('/:assignmentId/submissions/:submissionId/grade').patch(transformBody, controller.gradeSubmission);

/**
 * @route   GET /v1/admin/assignments/:id
 * @desc    Get assignment by ID
 * @access  Admin
 */
router.route('/:id').get(controller.get);

/**
 * @route   PUT /v1/admin/assignments/:id
 * @desc    Update an assignment
 * @access  Admin
 */
router.route('/:id').put(transformBody, controller.update);

/**
 * @route   DELETE /v1/admin/assignments/:id
 * @desc    Delete an assignment
 * @access  Admin
 */
router.route('/:id').delete(controller.remove);

export default router;