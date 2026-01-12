/**
 * Product and commerce-related Zod schemas
 */

import { z } from 'zod';
import { cuidSchema, urlSchema, paginationSchema } from './common';

// Product provider
export const productProviderSchema = z.enum(['SHOPIFY', 'MANUAL']);
export type ProductProvider = z.infer<typeof productProviderSchema>;

// Create product manually
export const createProductSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  price: z.coerce.number().min(0).optional(),
  currency: z.string().length(3).default('USD'),
  imageUrl: urlSchema.optional(),
  url: urlSchema,
  sku: z.string().optional(),
  inStock: z.boolean().default(true),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

// Update product
export const updateProductSchema = createProductSchema.partial();

export type UpdateProductInput = z.infer<typeof updateProductSchema>;

// Product response
export const productResponseSchema = z.object({
  id: z.string(),
  provider: productProviderSchema,
  externalId: z.string().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  price: z.number().nullable(),
  currency: z.string(),
  imageUrl: z.string().nullable(),
  url: z.string(),
  sku: z.string().nullable(),
  inStock: z.boolean(),
  syncedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProductResponse = z.infer<typeof productResponseSchema>;

// Product filters
export const productFiltersSchema = paginationSchema.extend({
  search: z.string().optional(),
  provider: productProviderSchema.optional(),
  inStock: z.coerce.boolean().optional(),
  sortBy: z.enum(['title', 'price', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ProductFilters = z.infer<typeof productFiltersSchema>;

// Shopify import config
export const shopifyImportConfigSchema = z.object({
  shopDomain: z
    .string()
    .min(1)
    .regex(/^[a-zA-Z0-9-]+\.myshopify\.com$/, 'Must be a valid Shopify domain'),
  accessToken: z.string().min(1),
});

export type ShopifyImportConfig = z.infer<typeof shopifyImportConfigSchema>;

// Map product to content
export const mapProductToContentSchema = z.object({
  productId: cuidSchema,
  ugcPostId: cuidSchema.optional(),
  repurposedClipId: cuidSchema.optional(),
  placementJson: z.record(z.unknown()).optional(),
  isPrimary: z.boolean().default(false),
});

export type MapProductToContentInput = z.infer<typeof mapProductToContentSchema>;

// Content-product mapping response
export const contentProductMapResponseSchema = z.object({
  id: z.string(),
  productId: z.string(),
  ugcPostId: z.string().nullable(),
  repurposedClipId: z.string().nullable(),
  placementJson: z.record(z.unknown()).nullable(),
  isPrimary: z.boolean(),
  product: productResponseSchema,
  createdAt: z.date(),
});

export type ContentProductMapResponse = z.infer<typeof contentProductMapResponseSchema>;
