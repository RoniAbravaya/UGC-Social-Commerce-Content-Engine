/**
 * Workspace Member API - Update or remove a specific member
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ugc/database';
import { updateMemberRoleSchema } from '@ugc/shared';
import { getWorkspaceContext, hasPermission, addAuditLog } from '@/lib/workspace';

interface Params {
  params: { slug: string; memberId: string };
}

// PATCH /api/workspaces/[slug]/members/[memberId] - Update member role
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const context = await getWorkspaceContext(params.slug);
    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Workspace not found or access denied' } },
        { status: 404 }
      );
    }

    // Only owners and admins can update member roles
    if (!hasPermission(context.role, 'admin')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = updateMemberRoleSchema.safeParse({ ...body, memberId: params.memberId });

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

    // Find the member
    const member = await prisma.workspaceMember.findFirst({
      where: {
        id: params.memberId,
        workspaceId: context.workspaceId,
      },
    });

    if (!member) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Member not found' } },
        { status: 404 }
      );
    }

    // Can't change owner's role
    if (member.role === 'OWNER') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: "Cannot change owner's role" } },
        { status: 403 }
      );
    }

    // Admins can only manage members and analysts, not other admins
    if (context.role === 'ADMIN' && member.role === 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: "Admins cannot modify other admins" } },
        { status: 403 }
      );
    }

    const oldRole = member.role;
    const updatedMember = await prisma.workspaceMember.update({
      where: { id: params.memberId },
      data: { role: validation.data.role },
      include: {
        user: {
          select: { id: true, email: true, name: true, image: true },
        },
      },
    });

    // Add audit log
    await addAuditLog({
      workspaceId: context.workspaceId,
      userId: context.userId,
      action: 'UPDATE',
      entityType: 'member',
      entityId: params.memberId,
      oldData: { role: oldRole },
      newData: { role: validation.data.role },
    });

    return NextResponse.json({
      success: true,
      data: { member: updatedMember },
    });
  } catch (error) {
    console.error('Error updating member:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update member' } },
      { status: 500 }
    );
  }
}

// DELETE /api/workspaces/[slug]/members/[memberId] - Remove member
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const context = await getWorkspaceContext(params.slug);
    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Workspace not found or access denied' } },
        { status: 404 }
      );
    }

    // Find the member
    const member = await prisma.workspaceMember.findFirst({
      where: {
        id: params.memberId,
        workspaceId: context.workspaceId,
      },
      include: {
        user: { select: { email: true } },
      },
    });

    if (!member) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Member not found' } },
        { status: 404 }
      );
    }

    // Users can remove themselves (leave workspace)
    const isSelf = member.userId === context.userId;

    // Owners can't leave (must transfer ownership first)
    if (member.role === 'OWNER') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Owner cannot leave. Transfer ownership first.' } },
        { status: 403 }
      );
    }

    // Non-self removal requires admin permission
    if (!isSelf && !hasPermission(context.role, 'admin')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    // Admins can only remove members and analysts
    if (!isSelf && context.role === 'ADMIN' && member.role === 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admins cannot remove other admins' } },
        { status: 403 }
      );
    }

    await prisma.workspaceMember.delete({
      where: { id: params.memberId },
    });

    // Add audit log
    await addAuditLog({
      workspaceId: context.workspaceId,
      userId: context.userId,
      action: 'DELETE',
      entityType: 'member',
      entityId: params.memberId,
      oldData: { email: member.user.email, role: member.role },
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Member removed successfully' },
    });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to remove member' } },
      { status: 500 }
    );
  }
}
