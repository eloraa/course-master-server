import { Router } from 'express';
import * as courseController from '@/api/controllers/public/course.controller';
import { validate } from '@/api/middlewares/validate';
import { getCourseSchema, listCoursesSchema } from '@/api/validations/public-course.validation';

const router = Router();

/**
 * @route GET /courses
 * @desc Browse published courses (public)
 * @access Public
 */
router.get('/', validate(listCoursesSchema), courseController.list);

/**
 * @route GET /courses/:slug
 * @desc View course details (public)
 * @access Public
 */
router.get('/:slug', validate(getCourseSchema), courseController.get);

/**
 * @route GET /courses/:slug/curriculum
 * @desc View course curriculum/structure (public)
 * @access Public
 */
router.get('/:slug/curriculum', validate(getCourseSchema), courseController.getCurriculum);

export default router;
