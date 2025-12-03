import { z } from 'zod';

const lessonSchema = z.object({
  title: z.string().min(1),
  type: z.enum(['video', 'article', 'quiz', 'assignment']),
  content: z.string().min(1),
  duration: z.number().optional(),
  resources: z
    .array(
      z.object({
        label: z.string(),
        url: z.url(),
      })
    )
    .optional(),
  order: z.number(),
});

const moduleSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  order: z.number(),
  lessons: z.array(lessonSchema).optional(),
});

const batchSchema = z.object({
  name: z.string().min(1),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()).optional(),
  capacity: z.number().optional(),
  priceOverride: z.number().optional(),
  metadata: z.any().optional(),
});

export const createCourseSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(200),
    slug: z
      .string()
      .min(3)
      .max(200)
      .regex(/^[a-z0-9-]+$/),
    shortDescription: z.string().min(10).max(500),
    fullDescription: z.string().min(10),
    category: z.string().min(1),
    tags: z.array(z.string()).optional(),
    price: z.number().min(0),
    currency: z.string().default('USD'),
    isPublished: z.boolean().default(false),
    visibility: z.enum(['public', 'unlisted', 'private']).default('public'),
    status: z.enum(['draft', 'published', 'archived']).default('draft'),
    thumbnailUrl: z.url().optional(),
    promoVideoUrl: z.url().optional(),
    level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    language: z.string().default('en'),
    estimatedEffort: z.string().optional(),
    courseType: z.enum(['self-paced', 'cohort', 'blended']).default('self-paced'),
    instructor: z.string().optional(), // ObjectId as string
    coInstructors: z.array(z.string()).optional(),
    modules: z.array(moduleSchema).optional(),
    batches: z.array(batchSchema).optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    keywords: z.array(z.string()).optional(),
  }),
});

export const updateCourseSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(200).optional(),
    slug: z
      .string()
      .min(3)
      .max(200)
      .regex(/^[a-z0-9-]+$/)
      .optional(),
    shortDescription: z.string().min(10).max(500).optional(),
    fullDescription: z.string().min(10).optional(),
    category: z.string().min(1).optional(),
    tags: z.array(z.string()).optional(),
    price: z.number().min(0).optional(),
    currency: z.string().optional(),
    isPublished: z.boolean().optional(),
    visibility: z.enum(['public', 'unlisted', 'private']).optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
    thumbnailUrl: z.url().optional(),
    promoVideoUrl: z.url().optional(),
    level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    language: z.string().optional(),
    estimatedEffort: z.string().optional(),
    courseType: z.enum(['self-paced', 'cohort', 'blended']).optional(),
    coInstructors: z.array(z.string()).optional(),
    modules: z.array(moduleSchema).optional(),
    batches: z.array(batchSchema).optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    keywords: z.array(z.string()).optional(),
  }),
});

export const getCourseSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});
