// @ts-nocheck
import { z } from 'zod';

export const getQuizSchema = z.object({
  params: z.object({
    courseId: z.string().min(1),
    quizId: z.string().min(1),
  }),
});

export const submitQuizSchema = z.object({
  params: z.object({
    courseId: z.string().min(1),
    quizId: z.string().min(1),
  }),
  body: z.object({
    answers: z.record(z.any()), // { questionId: answer }
    timeTaken: z.number().optional(),
  }),
});

export const getQuizResultsSchema = z.object({
  params: z.object({
    courseId: z.string().min(1),
    quizId: z.string().min(1),
  }),
});

export const getMyQuizzesSchema = z.object({
  query: z.object({
    courseId: z.string().optional(),
    page: z.string().optional(),
    perPage: z.string().optional(),
  }),
});
