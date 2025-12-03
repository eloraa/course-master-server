import { z } from 'zod';

const questionSchema = z.object({
  title: z.string().min(1),
  type: z.enum(['multiple-choice', 'true-false', 'short-answer', 'essay', 'matching']),
  content: z.string().min(1),
  options: z
    .array(
      z.object({
        text: z.string(),
        isCorrect: z.boolean(),
      })
    )
    .optional(),
  correctAnswer: z.any(),
  points: z.number().min(0).default(1),
  explanation: z.string().optional(),
  order: z.number(),
});

export const createQuizSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(200),
    description: z.string().optional(),
    instructions: z.string().optional(),
    course: z.string(), // ObjectId as string
    module: z.string(), // ObjectId as string
    lesson: z.string().optional(),
    questions: z.array(questionSchema),
    type: z.enum(['practice', 'graded', 'assessment']).default('practice'),
    passingScore: z.number().min(0).max(100).default(60),
    totalPoints: z.number().min(0),
    shuffleQuestions: z.boolean().default(false),
    shuffleOptions: z.boolean().default(false),
    showCorrectAnswers: z.boolean().default(true),
    allowReview: z.boolean().default(true),
    dueDate: z.string().or(z.date()).optional(),
    timeLimit: z.number().min(0).optional(),
    maxAttempts: z.number().min(1).default(1),
    availableFrom: z.string().or(z.date()).optional(),
    availableUntil: z.string().or(z.date()).optional(),
    autoGrade: z.boolean().default(true),
    gradingCriteria: z.string().optional(),
    isPublished: z.boolean().default(false),
  }),
});

export const updateQuizSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(200).optional(),
    description: z.string().optional(),
    instructions: z.string().optional(),
    questions: z.array(questionSchema).optional(),
    type: z.enum(['practice', 'graded', 'assessment']).optional(),
    passingScore: z.number().min(0).max(100).optional(),
    totalPoints: z.number().min(0).optional(),
    shuffleQuestions: z.boolean().optional(),
    shuffleOptions: z.boolean().optional(),
    showCorrectAnswers: z.boolean().optional(),
    allowReview: z.boolean().optional(),
    dueDate: z.string().or(z.date()).optional(),
    timeLimit: z.number().min(0).optional(),
    maxAttempts: z.number().min(1).optional(),
    availableFrom: z.string().or(z.date()).optional(),
    availableUntil: z.string().or(z.date()).optional(),
    autoGrade: z.boolean().optional(),
    gradingCriteria: z.string().optional(),
    isPublished: z.boolean().optional(),
  }),
});

export const getQuizSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});
