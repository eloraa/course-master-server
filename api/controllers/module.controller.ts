import httpStatus from 'http-status';
import type { Request, Response, NextFunction } from 'express';
import { Module } from '@/schema/module';

/**
 * Create a new module
 */
export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;

    req.body.createdBy = user._id;

    const module = new Module(req.body);
    const savedModule: any = await module.save();

    res.status(httpStatus.CREATED).json({
      status: httpStatus.CREATED,
      message: 'Module created successfully',
      data: savedModule.transform(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all modules with pagination and filters
 */
export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, perPage = 30, course, isPublished } = req.query;

    const listOptions: any = {
      page: Number(page),
      perPage: Number(perPage),
      course,
    };

    // Only include isPublished if explicitly provided
    if (isPublished !== undefined) {
      listOptions.isPublished = isPublished === 'true';
    }

    const result: any = await (Module as any).list(listOptions);

    res.json({
      status: httpStatus.OK,
      message: 'Modules retrieved successfully',
      data: result.modules.map((module: any) => module.transform()),
      pagination: {
        page: result.page,
        perPage: result.perPage,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get module by ID
 */
export const get = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const module = await (Module as any).get(id);

    res.json({
      status: httpStatus.OK,
      message: 'Module retrieved successfully',
      data: module.transform(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update module
 */
export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const module = await (Module as any).get(id);

    Object.assign(module, req.body);
    const updatedModule: any = await module.save();

    res.json({
      status: httpStatus.OK,
      message: 'Module updated successfully',
      data: updatedModule.transform(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete module
 */
export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const module = await (Module as any).get(id);

    await module.deleteOne();

    res.json({
      status: httpStatus.OK,
      message: 'Module deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export default { create, list, get, update, remove };
