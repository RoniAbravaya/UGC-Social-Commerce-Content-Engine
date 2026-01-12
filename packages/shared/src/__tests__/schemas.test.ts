/**
 * Unit tests for Zod schemas
 */

import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  createWorkspaceSchema,
  inviteMemberSchema,
  createProductSchema,
  importUgcManualSchema,
  createRightsRequestSchema,
} from '../schemas';

describe('registerSchema', () => {
  it('should validate valid registration data', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'Password123',
      name: 'Test User',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = registerSchema.safeParse({
      email: 'invalid-email',
      password: 'Password123',
      name: 'Test User',
    });
    expect(result.success).toBe(false);
  });

  it('should reject weak password', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'weak',
      name: 'Test User',
    });
    expect(result.success).toBe(false);
  });

  it('should reject password without uppercase', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('should validate valid login data', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: 'password',
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty password', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('createWorkspaceSchema', () => {
  it('should validate valid workspace data', () => {
    const result = createWorkspaceSchema.safeParse({
      name: 'My Workspace',
    });
    expect(result.success).toBe(true);
  });

  it('should validate with optional slug', () => {
    const result = createWorkspaceSchema.safeParse({
      name: 'My Workspace',
      slug: 'my-workspace',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid slug format', () => {
    const result = createWorkspaceSchema.safeParse({
      name: 'My Workspace',
      slug: 'Invalid Slug!',
    });
    expect(result.success).toBe(false);
  });

  it('should reject short name', () => {
    const result = createWorkspaceSchema.safeParse({
      name: 'A',
    });
    expect(result.success).toBe(false);
  });
});

describe('inviteMemberSchema', () => {
  it('should validate valid invitation', () => {
    const result = inviteMemberSchema.safeParse({
      email: 'member@example.com',
      role: 'MEMBER',
    });
    expect(result.success).toBe(true);
  });

  it('should reject OWNER role', () => {
    const result = inviteMemberSchema.safeParse({
      email: 'member@example.com',
      role: 'OWNER',
    });
    expect(result.success).toBe(false);
  });

  it('should accept valid roles', () => {
    for (const role of ['ADMIN', 'MEMBER', 'ANALYST']) {
      const result = inviteMemberSchema.safeParse({
        email: 'member@example.com',
        role,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe('createProductSchema', () => {
  it('should validate valid product', () => {
    const result = createProductSchema.safeParse({
      title: 'Test Product',
      price: 99.99,
      url: 'https://example.com/product',
    });
    expect(result.success).toBe(true);
  });

  it('should accept product without price', () => {
    const result = createProductSchema.safeParse({
      title: 'Test Product',
      url: 'https://example.com/product',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid URL', () => {
    const result = createProductSchema.safeParse({
      title: 'Test Product',
      url: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });

  it('should reject negative price', () => {
    const result = createProductSchema.safeParse({
      title: 'Test Product',
      price: -10,
      url: 'https://example.com/product',
    });
    expect(result.success).toBe(false);
  });
});

describe('importUgcManualSchema', () => {
  it('should validate valid UGC import', () => {
    const result = importUgcManualSchema.safeParse({
      postUrl: 'https://tiktok.com/@user/video/123',
      platform: 'TIKTOK',
      creatorHandle: 'user',
    });
    expect(result.success).toBe(true);
  });

  it('should accept all platforms', () => {
    for (const platform of ['TIKTOK', 'INSTAGRAM', 'YOUTUBE', 'MANUAL']) {
      const result = importUgcManualSchema.safeParse({
        postUrl: 'https://example.com/post',
        platform,
        creatorHandle: 'user',
      });
      expect(result.success).toBe(true);
    }
  });

  it('should accept optional fields', () => {
    const result = importUgcManualSchema.safeParse({
      postUrl: 'https://tiktok.com/@user/video/123',
      platform: 'TIKTOK',
      creatorHandle: 'user',
      creatorName: 'User Name',
      caption: 'Test caption',
      hashtags: ['test', 'ugc'],
      postedAt: '2024-01-01T00:00:00Z',
    });
    expect(result.success).toBe(true);
  });
});

describe('createRightsRequestSchema', () => {
  it('should validate valid rights request', () => {
    const result = createRightsRequestSchema.safeParse({
      ugcPostId: 'clxxxxxxxxxxxxxxxxxx',
      requestMessage: 'Hi! Can we use your content?',
    });
    expect(result.success).toBe(true);
  });

  it('should accept optional request method', () => {
    const result = createRightsRequestSchema.safeParse({
      ugcPostId: 'clxxxxxxxxxxxxxxxxxx',
      requestMessage: 'Hi! Can we use your content?',
      requestMethod: 'dm',
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty message', () => {
    const result = createRightsRequestSchema.safeParse({
      ugcPostId: 'clxxxxxxxxxxxxxxxxxx',
      requestMessage: '',
    });
    expect(result.success).toBe(false);
  });
});
