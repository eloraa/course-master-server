import { Router } from 'express';
import * as assignmentController from '@/api/controllers/student/assignment.controller';
import { validate } from '@/api/middlewares/validate';
import { transformBody } from '@/api/middlewares/transform-body';
import {
  getAssignmentSchema,
  submitAssignmentSchema,
  getSubmissionStatusSchema,
  getMyAssignmentsSchema,
} from '@/api/validations/assignment-submission.validation';

const router = Router();

/**
 * @route GET /me/assignments
 * @desc Get all user's assignments
 * @access Authenticated
 */
router.get('/', validate(getMyAssignmentsSchema), assignmentController.getMyAssignments);

/**
 * @route GET /me/courses/:courseId/assignments/:assignmentId
 * @desc Get assignment details
 * @access Authenticated
 */
router.get('/:courseId/assignments/:assignmentId', validate(getAssignmentSchema), assignmentController.getAssignment);

/**
 * @route POST /me/courses/:courseId/assignments/:assignmentId/submit
 * @desc Submit assignment
 * @access Authenticated
 */
router.post(
  '/:courseId/assignments/:assignmentId/submit',
  transformBody,
  validate(submitAssignmentSchema),
  assignmentController.submitAssignment
);

/**
 * @route GET /me/courses/:courseId/assignments/:assignmentId/submission
 * @desc Get submission status
 * @access Authenticated
 */
router.get(
  '/:courseId/assignments/:assignmentId/submission',
  validate(getSubmissionStatusSchema),
  assignmentController.getSubmissionStatus
);

export default router;
