/**
 * Repurpose Job API - Get job status and clips
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ugc/database';
import { getWorkspaceContext, hasPermission, addAuditLog } from '@/lib/workspace';

interface Params {
  params: { slug: string; jobId: string };
}

// GET /api/workspaces/[slug]/repurpose/[jobId]
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const context = await getWorkspaceContext(params.slug);
    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Workspace not found' } },
        { status: 404 }
      );
    }

    const job = await prisma.repurposeJob.findFirst({
      where: { id: params.jobId, workspaceId: context.workspaceId },
      include: {
        sourceMediaAsset: {
          select: {
            id: true,
            storageUrl: true,
            duration: true,
            width: true,
            height: true,
            ugcPost: {
              select: { creatorHandle: true, platform: true },
            },
          },
        },
        repurposedClips: {
          include: {
            contentProductMaps: {
              include: { product: { select: { id: true, title: true } } },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Job not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: { job } });
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch job' } },
      { status: 500 }
    );
  }
}

// DELETE /api/workspaces/[slug]/repurpose/[jobId] - Cancel a job
export async function DELETE(request: NextRequest, { params }: Params) {
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

    const job = await prisma.repurposeJob.findFirst({
      where: { id: params.jobId, workspaceId: context.workspaceId },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Job not found' } },
        { status: 404 }
      );
    }

    if (job.status === 'COMPLETED' || job.status === 'FAILED') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATE', message: 'Cannot cancel completed job' } },
        { status: 400 }
      );
    }

    await prisma.repurposeJob.update({
      where: { id: params.jobId },
      data: { status: 'CANCELLED' },
    });

    // TODO: Cancel the BullMQ job

    await addAuditLog({
      workspaceId: context.workspaceId,
      userId: context.userId,
      action: 'UPDATE',
      entityType: 'repurpose_job',
      entityId: params.jobId,
      oldData: { status: job.status },
      newData: { status: 'CANCELLED' },
    });

    return NextResponse.json({ success: true, data: { message: 'Job cancelled' } });
  } catch (error) {
    console.error('Error cancelling job:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to cancel job' } },
      { status: 500 }
    );
  }
}
