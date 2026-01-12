/**
 * Rights Request API - Update status of a rights request
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ugc/database';
import { updateRightsStatusSchema } from '@ugc/shared';
import { getWorkspaceContext, hasPermission, addAuditLog } from '@/lib/workspace';

interface Params {
  params: { slug: string; requestId: string };
}

// GET /api/workspaces/[slug]/rights/[requestId]
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const context = await getWorkspaceContext(params.slug);
    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Workspace not found' } },
        { status: 404 }
      );
    }

    const rightsRequest = await prisma.rightsRequest.findFirst({
      where: { id: params.requestId, workspaceId: context.workspaceId },
      include: {
        ugcPost: {
          select: {
            id: true,
            platform: true,
            postUrl: true,
            creatorHandle: true,
            creatorName: true,
            caption: true,
            thumbnailUrl: true,
          },
        },
      },
    });

    if (!rightsRequest) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Request not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: { rightsRequest } });
  } catch (error) {
    console.error('Error fetching rights request:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch request' } },
      { status: 500 }
    );
  }
}

// PATCH /api/workspaces/[slug]/rights/[requestId] - Update status
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const context = await getWorkspaceContext(params.slug);
    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Workspace not found' } },
        { status: 404 }
      );
    }

    if (!hasPermission(context.role, 'write')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = updateRightsStatusSchema.safeParse(body);

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

    const existing = await prisma.rightsRequest.findFirst({
      where: { id: params.requestId, workspaceId: context.workspaceId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Request not found' } },
        { status: 404 }
      );
    }

    const { status, proofUrl, proofNotes, expiresAt } = validation.data;

    const updateData: Record<string, unknown> = {
      status,
      proofUrl,
      proofNotes,
      expiresAt,
    };

    // Set timestamp based on status
    if (status === 'APPROVED') {
      updateData.approvedAt = new Date();
    } else if (status === 'DENIED') {
      updateData.deniedAt = new Date();
    }

    const rightsRequest = await prisma.rightsRequest.update({
      where: { id: params.requestId },
      data: updateData,
    });

    await addAuditLog({
      workspaceId: context.workspaceId,
      userId: context.userId,
      action: status === 'APPROVED' ? 'APPROVE' : status === 'DENIED' ? 'DENY' : 'UPDATE',
      entityType: 'rights_request',
      entityId: params.requestId,
      oldData: { status: existing.status },
      newData: { status },
    });

    return NextResponse.json({ success: true, data: { rightsRequest } });
  } catch (error) {
    console.error('Error updating rights request:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update request' } },
      { status: 500 }
    );
  }
}
