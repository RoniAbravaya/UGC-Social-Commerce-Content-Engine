/**
 * Workspace API - Get, update, delete a specific workspace
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ugc/database';
import { updateWorkspaceSchema } from '@ugc/shared';
import { getWorkspaceContext, hasPermission, addAuditLog } from '@/lib/workspace';

interface Params {
  params: { slug: string };
}

// GET /api/workspaces/[slug] - Get workspace details
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const context = await getWorkspaceContext(params.slug);
    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Workspace not found or access denied' } },
        { status: 404 }
      );
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: context.workspaceId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, name: true, image: true },
            },
          },
        },
        _count: {
          select: {
            ugcPosts: true,
            products: true,
            repurposedClips: true,
            shoppablePages: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        workspace,
        role: context.role,
      },
    });
  } catch (error) {
    console.error('Error fetching workspace:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch workspace' } },
      { status: 500 }
    );
  }
}

// PATCH /api/workspaces/[slug] - Update workspace
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const context = await getWorkspaceContext(params.slug);
    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Workspace not found or access denied' } },
        { status: 404 }
      );
    }

    // Only owners and admins can update workspace
    if (!hasPermission(context.role, 'admin')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = updateWorkspaceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: validation.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    // Get old data for audit log
    const oldWorkspace = await prisma.workspace.findUnique({
      where: { id: context.workspaceId },
    });

    const updateData = {
      ...validation.data,
      settings: validation.data.settings ? JSON.parse(JSON.stringify(validation.data.settings)) : undefined,
    };

    const workspace = await prisma.workspace.update({
      where: { id: context.workspaceId },
      data: updateData,
    });

    // Add audit log
    await addAuditLog({
      workspaceId: context.workspaceId,
      userId: context.userId,
      action: 'UPDATE',
      entityType: 'workspace',
      entityId: context.workspaceId,
      oldData: oldWorkspace as Record<string, unknown>,
      newData: workspace as unknown as Record<string, unknown>,
    });

    return NextResponse.json({
      success: true,
      data: { workspace },
    });
  } catch (error) {
    console.error('Error updating workspace:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update workspace' } },
      { status: 500 }
    );
  }
}

// DELETE /api/workspaces/[slug] - Delete workspace
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const context = await getWorkspaceContext(params.slug);
    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Workspace not found or access denied' } },
        { status: 404 }
      );
    }

    // Only owners can delete workspace
    if (!hasPermission(context.role, 'owner')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only the owner can delete this workspace' } },
        { status: 403 }
      );
    }

    // Delete workspace (cascade will handle related records)
    await prisma.workspace.delete({
      where: { id: context.workspaceId },
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Workspace deleted successfully' },
    });
  } catch (error) {
    console.error('Error deleting workspace:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete workspace' } },
      { status: 500 }
    );
  }
}
