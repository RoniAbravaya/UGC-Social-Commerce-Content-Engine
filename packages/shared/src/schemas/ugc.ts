/**
 * UGC and rights management Zod schemas
 */

import { z } from 'zod';
import { cuidSchema, urlSchema, paginationSchema, dateRangeSchema } from './common';

// Platforms
export const platformSchema = z.enum(['TIKTOK', 'INSTAGRAM', 'YOUTUBE', 'MANUAL']);
export type Platform = z.infer<typeof platformSchema>;

// Rights status
export const rightsStatusSchema = z.enum(['PENDING', 'REQUESTED', 'APPROVED', 'DENIED', 'EXPIRED']);
export type RightsStatus = z.infer<typeof rightsStatusSchema>;

// Social account status
export const socialAccountStatusSchema = z.enum(['CONNECTED', 'DISCONNECTED', 'EXPIRED', 'ERROR']);
export type SocialAccountStatus = z.infer<typeof socialAccountStatusSchema>;

// Connect social account
export const connectSocialAccountSchema = z.object({
  platform: platformSchema,
  handle: z.string().min(1).max(100),
  displayName: z.string().optional(),
  profileUrl: z.string().url().optional(),
});

export type ConnectSocialAccountInput = z.infer<typeof connectSocialAccountSchema>;

// Manual UGC import
export const importUgcManualSchema = z.object({
  postUrl: urlSchema,
  platform: platformSchema,
  creatorHandle: z.string().min(1).max(100),
  creatorName: z.string().optional(),
  caption: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  postedAt: z.coerce.date().optional(),
});

export type ImportUgcManualInput = z.infer<typeof importUgcManualSchema>;

// CSV import row
export const importUgcCsvRowSchema = z.object({
  post_url: urlSchema,
  platform: z.string().transform((val) => val.toUpperCase() as Platform),
  creator_handle: z.string().min(1),
  creator_name: z.string().optional(),
  caption: z.string().optional(),
  hashtags: z.string().optional(), // Comma-separated
  posted_at: z.string().optional(),
});

export type ImportUgcCsvRow = z.infer<typeof importUgcCsvRowSchema>;

// UGC post filters
export const ugcPostFiltersSchema = paginationSchema.extend({
  platform: platformSchema.optional(),
  rightsStatus: rightsStatusSchema.optional(),
  creatorHandle: z.string().optional(),
  hashtag: z.string().optional(),
  search: z.string().optional(),
  ...dateRangeSchema.shape,
  sortBy: z.enum(['postedAt', 'createdAt', 'creatorHandle']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type UgcPostFilters = z.infer<typeof ugcPostFiltersSchema>;

// UGC post response
export const ugcPostResponseSchema = z.object({
  id: z.string(),
  platform: platformSchema,
  postUrl: z.string(),
  creatorHandle: z.string(),
  creatorName: z.string().nullable(),
  caption: z.string().nullable(),
  hashtags: z.array(z.string()),
  thumbnailUrl: z.string().nullable(),
  metricsJson: z.record(z.unknown()).nullable(),
  postedAt: z.date().nullable(),
  createdAt: z.date(),
  rightsStatus: rightsStatusSchema.nullable(),
  hasMedia: z.boolean(),
});

export type UgcPostResponse = z.infer<typeof ugcPostResponseSchema>;

// Rights request
export const createRightsRequestSchema = z.object({
  ugcPostId: cuidSchema,
  requestMessage: z.string().min(1).max(2000),
  requestMethod: z.enum(['dm', 'email', 'comment']).optional(),
});

export type CreateRightsRequestInput = z.infer<typeof createRightsRequestSchema>;

// Update rights status
export const updateRightsStatusSchema = z.object({
  status: rightsStatusSchema,
  proofUrl: urlSchema.optional(),
  proofNotes: z.string().optional(),
  expiresAt: z.coerce.date().optional(),
});

export type UpdateRightsStatusInput = z.infer<typeof updateRightsStatusSchema>;

// Rights request response
export const rightsRequestResponseSchema = z.object({
  id: z.string(),
  ugcPostId: z.string(),
  status: rightsStatusSchema,
  requestMessage: z.string().nullable(),
  requestMethod: z.string().nullable(),
  requestSentAt: z.date().nullable(),
  proofUrl: z.string().nullable(),
  proofNotes: z.string().nullable(),
  approvedAt: z.date().nullable(),
  deniedAt: z.date().nullable(),
  expiresAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type RightsRequestResponse = z.infer<typeof rightsRequestResponseSchema>;

// Rights request templates
export const rightsRequestTemplates = {
  dm: `Hi {creator_name}! 👋

We love your content featuring {hashtag/product}! We'd love to feature it on our channels and website.

Would you be open to granting us permission to use this content? We'll credit you of course!

Reply with "YES" to approve. Thanks! ❤️`,
  email: `Subject: Permission to Feature Your Amazing Content

Hi {creator_name},

We came across your content about {hashtag/product} and absolutely loved it!

We would love to feature it on our website and social media channels, with full credit to you of course.

If you're open to this, please reply to this email with your approval.

Thank you!
{brand_name}`,
  comment: `Hey! We love this! 😍 Can we feature it on our page? Reply YES to approve! 🙌`,
};
