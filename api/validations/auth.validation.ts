import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(3).max(50),
    email: z.string().email(),
    password: z.string().min(6).max(128),
    role: z.enum(['student', 'admin']).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1).max(128),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    email: z.string().email(),
    refreshToken: z.string().min(1),
  }),
});
