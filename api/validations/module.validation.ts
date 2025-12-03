import { z } from 'zod';

export const createModuleSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(200),
    description: z.string().optional(),
    course: z.string(), // ObjectId as string
    order: z.number().min(0),
    isPublished: z.boolean().default(false),
  }),
});

export const updateModuleSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(200).optional(),
    description: z.string().optional(),
    order: z.number().min(0).optional(),
    isPublished: z.boolean().optional(),
  }),
});

export const getModuleSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});
