/**
 * Workspace and RBAC-related Zod schemas
 */

import { z } from 'zod';
import { slugSchema, emailSchema, cuidSchema } from './common';

// Workspace roles
export const workspaceRoleSchema = z.enum(['OWNER', 'ADMIN', 'MEMBER', 'ANALYST']);
export type WorkspaceRole = z.infer<typeof workspaceRoleSchema>;

// Workspace plans
export const workspacePlanSchema = z.enum(['FREE', 'STARTER', 'GROWTH', 'SCALE']);
export type WorkspacePlan = z.infer<typeof workspacePlanSchema>;

// Create workspace
export const createWorkspaceSchema = z.object({
  name: z.string().min(2).max(100),
  slug: slugSchema.optional(), // Will be auto-generated if not provided
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

// Update workspace
export const updateWorkspaceSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  logoUrl: z.string().url().optional().nullable(),
  domain: z.string().optional().nullable(),
  settings: z.record(z.unknown()).optional(),
});

export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;

// Workspace response
export const workspaceResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  plan: workspacePlanSchema,
  logoUrl: z.string().nullable(),
  domain: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type WorkspaceResponse = z.infer<typeof workspaceResponseSchema>;

// Invite member
export const inviteMemberSchema = z.object({
  email: emailSchema,
  role: workspaceRoleSchema.exclude(['OWNER']), // Can't invite as owner
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

// Update member role
export const updateMemberRoleSchema = z.object({
  memberId: cuidSchema,
  role: workspaceRoleSchema.exclude(['OWNER']), // Can't change to owner
});

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;

// Member response
export const memberResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  workspaceId: z.string(),
  role: workspaceRoleSchema,
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string().nullable(),
    image: z.string().nullable(),
  }),
  createdAt: z.date(),
});

export type MemberResponse = z.infer<typeof memberResponseSchema>;

// Invitation response
export const invitationResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  role: workspaceRoleSchema,
  expiresAt: z.date(),
  createdAt: z.date(),
});

export type InvitationResponse = z.infer<typeof invitationResponseSchema>;

// Accept invitation
export const acceptInvitationSchema = z.object({
  token: z.string().min(1),
});

export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;

// Workspace with role (for user's workspace list)
export const workspaceWithRoleSchema = workspaceResponseSchema.extend({
  role: workspaceRoleSchema,
  memberCount: z.number(),
});

export type WorkspaceWithRole = z.infer<typeof workspaceWithRoleSchema>;

// Role permissions helper
export const rolePermissions = {
  OWNER: ['manage:workspace', 'manage:members', 'manage:billing', 'write:all', 'read:all'],
  ADMIN: ['manage:members', 'write:all', 'read:all'],
  MEMBER: ['write:content', 'read:all'],
  ANALYST: ['read:all', 'read:analytics'],
} as const;

export const hasPermission = (role: WorkspaceRole, permission: string): boolean => {
  const permissions = rolePermissions[role];
  return (
    permissions.includes(permission as never) ||
    permissions.includes('write:all' as never) ||
    (permission.startsWith('read:') && permissions.includes('read:all' as never))
  );
};
