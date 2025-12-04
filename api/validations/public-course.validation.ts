import { z } from 'zod';

export const getCourseSchema = z.object({
  params: z.object({
    slug: z.string().min(1),
  }),
});

export const listCoursesSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    perPage: z.string().optional(),
    category: z.string().optional(),
    level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
    search: z.string().optional(),
  }),
});
