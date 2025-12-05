import { z } from 'zod';

export const getCourseSchema = z.object({
  params: z.object({
    courseId: z.string().min(1),
  }),
});

export const getModuleSchema = z.object({
  params: z.object({
    courseId: z.string().min(1),
    moduleId: z.string().min(1),
  }),
});

export const getLessonSchema = z.object({
  params: z.object({
    courseId: z.string().min(1),
    lessonId: z.string().min(1),
  }),
});

export const markCompleteSchema = z.object({
  params: z.object({
    courseId: z.string().min(1),
    lessonId: z.string().min(1),
  }),
});

export const createEnrollmentSchema = z.object({
  body: z.object({
    courseId: z.string().min(1),
    batchId: z.string().optional(),
  }),
});
