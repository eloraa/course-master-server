import { z } from 'zod';

const resourceSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
});

export const createLessonSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(200),
    course: z.string(), // ObjectId as string
    module: z.string(), // ObjectId as string
    type: z.enum(['video', 'article', 'quiz', 'assignment']),
    content: z.string().min(1),
    duration: z.number().min(0).optional(),
    resources: z.array(resourceSchema).optional(),
    order: z.number().min(0),
    isPublished: z.boolean().default(false),
    quiz: z.string().optional(), // ObjectId as string
    assignment: z.string().optional(), // ObjectId as string
  }),
});

export const updateLessonSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(200).optional(),
    type: z.enum(['video', 'article', 'quiz', 'assignment']).optional(),
    content: z.string().min(1).optional(),
    duration: z.number().min(0).optional(),
    resources: z.array(resourceSchema).optional(),
    order: z.number().min(0).optional(),
    isPublished: z.boolean().optional(),
    quiz: z.string().optional(),
    assignment: z.string().optional(),
  }),
});

export const getLessonSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});
