import { Router } from 'express';
import * as courseController from '@/api/controllers/student/course.controller';
import { validate } from '@/api/middlewares/validate';
import { getCourseSchema } from '@/api/validations/student-content.validation';

const router = Router();

/**
 * @route GET /me/courses
 * @desc Get enrolled courses
 * @access Authenticated
 */
router.get('/', courseController.getMyEnrolledCourses);

/**
 * @route GET /me/courses/:courseId
 * @desc Get enrolled course details
 * @access Authenticated
 */
router.get('/:courseId', validate(getCourseSchema), courseController.getEnrolledCourse);

/**
 * @route GET /me/courses/:courseId/progress
 * @desc Get course progress
 * @access Authenticated
 */
router.get('/:courseId/progress', validate(getCourseSchema), courseController.getCourseProgress);

export default router;
