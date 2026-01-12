/**
 * Repurpose Jobs API - Create and manage repurposing jobs
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma, JobStatus } from '@ugc/database';
import { z } from 'zod';
import { getWorkspaceContext, hasPermission, addAuditLog } from '@/lib/workspace';

interface Params {
  params: { slug: string };
}

const createJobSchema = z.object({
  sourceMediaAssetId: z.string().cuid(),
  params: z.object({
    durations: z.array(z.number()).default([10, 20, 30]),
    formats: z.array(z.enum(['VERTICAL_9_16', 'SQUARE_1_1', 'HORIZONTAL_16_9'])).default(['VERTICAL_9_16']),
    generateCaptions: z.boolean().default(true),
    burnInCaptions: z.boolean().default(false),
    captionStyle: z.object({
      fontFamily: z.string().optional(),
      fontSize: z.number().optional(),
      fontColor: z.string().optional(),
      backgroundColor: z.string().optional(),
      position: z.enum(['top', 'center', 'bottom']).optional(),
    }).optional(),
  }),
});

// GET /api/workspaces/[slug]/repurpose - List repurpose jobs
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const context = await getWorkspaceContext(params.slug);
    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Workspace not found' } },
        { status: 404 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as JobStatus | null;

    const jobs = await prisma.repurposeJob.findMany({
      where: {
        workspaceId: context.workspaceId,
        ...(status && { status }),
      },
      include: {
        sourceMediaAsset: {
          select: { id: true, storageUrl: true, duration: true },
        },
        _count: { select: { repurposedClips: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ success: true, data: { jobs } });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch jobs' } },
      { status: 500 }
    );
  }
}

// POST /api/workspaces/[slug]/repurpose - Create a repurpose job
export async function POST(request: NextRequest, { params }: Params) {
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
    const validation = createJobSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: validation.error.flatten().fieldErrors },
        },
        { status: 400 }
      );
    }

    const { sourceMediaAssetId, params: jobParams } = validation.data;

    // Verify media asset belongs to workspace and is ready
    const mediaAsset = await prisma.mediaAsset.findFirst({
      where: { 
        id: sourceMediaAssetId, 
        workspaceId: context.workspaceId,
        type: 'VIDEO',
      },
    });

    if (!mediaAsset) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Media asset not found' } },
        { status: 404 }
      );
    }

    if (mediaAsset.status !== 'READY') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATE', message: 'Media asset is not ready for processing' } },
        { status: 400 }
      );
    }

    // Create job
    const job = await prisma.repurposeJob.create({
      data: {
        workspaceId: context.workspaceId,
        sourceMediaAssetId,
        status: 'QUEUED',
        paramsJson: JSON.parse(JSON.stringify(jobParams)),
      },
    });

    // TODO: Queue the job with BullMQ
    // await queueClipGeneration(job.id, sourceMediaAssetId, jobParams);

    await addAuditLog({
      workspaceId: context.workspaceId,
      userId: context.userId,
      action: 'CREATE',
      entityType: 'repurpose_job',
      entityId: job.id,
      newData: { sourceMediaAssetId, params: jobParams },
    });

    return NextResponse.json({ success: true, data: { job } }, { status: 201 });
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create job' } },
      { status: 500 }
    );
  }
}
