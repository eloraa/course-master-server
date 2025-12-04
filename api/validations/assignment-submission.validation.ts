import { z } from 'zod';

export const getAssignmentSchema = z.object({
  params: z.object({
    courseId: z.string().min(1),
    assignmentId: z.string().min(1),
  }),
});

export const submitAssignmentSchema = z.object({
  params: z.object({
    courseId: z.string().min(1),
    assignmentId: z.string().min(1),
  }),
  body: z.object({
    answer: z.string().min(1, 'Answer cannot be empty'),
  }),
});

export const getSubmissionStatusSchema = z.object({
  params: z.object({
    courseId: z.string().min(1),
    assignmentId: z.string().min(1),
  }),
});

export const getMyAssignmentsSchema = z.object({
  query: z.object({
    courseId: z.string().optional(),
    page: z.string().optional(),
    perPage: z.string().optional(),
  }),
});
