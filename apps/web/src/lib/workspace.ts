/**
 * Workspace utilities and server-side helpers
 */

import { prisma, WorkspaceRole } from '@ugc/database';
import { generateSlug } from '@ugc/shared';
import { getSession } from './auth';

export interface WorkspaceContext {
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
}

/**
 * Get the current workspace context from session and params
 */
export async function getWorkspaceContext(workspaceSlug: string): Promise<WorkspaceContext | null> {
  const session = await getSession();
  if (!session?.user?.id) {
    return null;
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    include: {
      members: {
        where: { userId: session.user.id },
        select: { role: true },
      },
    },
  });

  if (!workspace || workspace.members.length === 0) {
    return null;
  }

  return {
    workspaceId: workspace.id,
    userId: session.user.id,
    role: workspace.members[0].role,
  };
}

/**
 * Check if user has required permission in workspace
 */
export function hasPermission(
  role: WorkspaceRole,
  requiredPermission: 'read' | 'write' | 'admin' | 'owner'
): boolean {
  const roleHierarchy: Record<WorkspaceRole, number> = {
    OWNER: 4,
    ADMIN: 3,
    MEMBER: 2,
    ANALYST: 1,
  };

  const permissionLevel: Record<string, number> = {
    read: 1,
    write: 2,
    admin: 3,
    owner: 4,
  };

  return roleHierarchy[role] >= permissionLevel[requiredPermission];
}

/**
 * Create a new workspace for a user
 */
export async function createWorkspace(userId: string, name: string, slug?: string) {
  // Generate unique slug
  let workspaceSlug = slug || generateSlug(name);
  let counter = 1;

  // Ensure slug is unique
  while (await prisma.workspace.findUnique({ where: { slug: workspaceSlug } })) {
    workspaceSlug = `${generateSlug(name)}-${counter}`;
    counter++;
  }

  // Create workspace with owner membership
  const workspace = await prisma.workspace.create({
    data: {
      name,
      slug: workspaceSlug,
      members: {
        create: {
          userId,
          role: 'OWNER',
        },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
            },
          },
        },
      },
    },
  });

  return workspace;
}

/**
 * Get all workspaces for a user
 */
export async function getUserWorkspaces(userId: string) {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: true,
    },
    orderBy: {
      workspace: {
        createdAt: 'desc',
      },
    },
  });

  return memberships.map((m) => ({
    ...m.workspace,
    role: m.role,
  }));
}

/**
 * Get workspace members
 */
export async function getWorkspaceMembers(workspaceId: string) {
  return prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
}

/**
 * Add audit log entry
 */
export async function addAuditLog(params: {
  workspaceId: string;
  userId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'DENY' | 'PUBLISH' | 'UNPUBLISH' | 'EXPORT';
  entityType: string;
  entityId: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}) {
  return prisma.auditLog.create({
    data: {
      workspaceId: params.workspaceId,
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      oldData: params.oldData ? JSON.parse(JSON.stringify(params.oldData)) : undefined,
      newData: params.newData ? JSON.parse(JSON.stringify(params.newData)) : undefined,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  });
}
