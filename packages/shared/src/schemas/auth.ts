/**
 * Authentication and user-related Zod schemas
 */

import { z } from 'zod';
import { emailSchema } from './common';

// User registration
export const registerSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(1).max(100),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// User login
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Password reset request
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// Password reset
export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// Update user profile
export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  image: z.string().url().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// User response (safe to expose)
export const userResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  image: z.string().nullable(),
  createdAt: z.date(),
});

export type UserResponse = z.infer<typeof userResponseSchema>;
