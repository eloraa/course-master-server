import { Router } from 'express';
import * as moduleController from '@/api/controllers/module.controller';
import { validate } from '@/api/middlewares/validate';
import { transformBody } from '@/api/middlewares/transform-body';
import { createModuleSchema, updateModuleSchema, getModuleSchema } from '@/api/validations/module.validation';

const router = Router();

/**
 * @route POST /admin/modules
 * @desc Create a new module
 * @access Admin only
 */
router.post('/', transformBody, validate(createModuleSchema), moduleController.create);

/**
 * @route GET /admin/modules
 * @desc Get all modules with filters
 * @access Admin only
 */
router.get('/', moduleController.list);

/**
 * @route GET /admin/modules/:id
 * @desc Get module by ID
 * @access Admin only
 */
router.get('/:id', validate(getModuleSchema), moduleController.get);

/**
 * @route PUT /admin/modules/:id
 * @desc Update module
 * @access Admin only
 */
router.put('/:id', transformBody, validate(updateModuleSchema), moduleController.update);

/**
 * @route DELETE /admin/modules/:id
 * @desc Delete module
 * @access Admin only
 */
router.delete('/:id', validate(getModuleSchema), moduleController.remove);

export default router;
