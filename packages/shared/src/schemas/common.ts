/**
 * Common Zod schemas used across multiple domains
 */

import { z } from 'zod';

// Pagination
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
    hasMore: z.boolean(),
  });

// Sorting
export const sortOrderSchema = z.enum(['asc', 'desc']).default('desc');

// Date range filter
export const dateRangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

// ID validation
export const cuidSchema = z.string().cuid();

// Slug validation
export const slugSchema = z
  .string()
  .min(2)
  .max(50)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens');

// URL validation
export const urlSchema = z.string().url();
export const optionalUrlSchema = z.string().url().optional().or(z.literal(''));

// Email validation
export const emailSchema = z.string().email().toLowerCase();

// UTM parameters
export const utmParamsSchema = z.object({
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmContent: z.string().optional(),
  utmTerm: z.string().optional(),
});

export type UtmParams = z.infer<typeof utmParamsSchema>;

// API Response wrappers
export const apiSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  });

export const apiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
  }),
});
