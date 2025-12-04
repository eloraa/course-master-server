import { Router } from 'express';
import * as contentController from '@/api/controllers/student/content.controller';
import { validate } from '@/api/middlewares/validate';
import { getCourseSchema, getModuleSchema, getLessonSchema, markCompleteSchema } from '@/api/validations/student-content.validation';

const router = Router();

/**
 * @route GET /me/courses/:courseId/modules
 * @desc Get course modules
 * @access Authenticated
 */
router.get('/:courseId/modules', validate(getCourseSchema), contentController.getCourseModules);

/**
 * @route GET /me/courses/:courseId/modules/:moduleId/lessons
 * @desc Get module lessons
 * @access Authenticated
 */
router.get('/:courseId/modules/:moduleId/lessons', validate(getModuleSchema), contentController.getModuleLessons);

/**
 * @route GET /me/courses/:courseId/lessons/:lessonId
 * @desc Get lesson content
 * @access Authenticated
 */
router.get('/:courseId/lessons/:lessonId', validate(getLessonSchema), contentController.getLesson);

/**
 * @route POST /me/courses/:courseId/lessons/:lessonId/complete
 * @desc Mark lesson as completed
 * @access Authenticated
 */
router.post('/:courseId/lessons/:lessonId/complete', validate(markCompleteSchema), contentController.markLessonComplete);

export default router;
