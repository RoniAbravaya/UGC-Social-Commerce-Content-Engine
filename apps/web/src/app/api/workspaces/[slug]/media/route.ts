/**
 * Media Assets API - List and manage media
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma, MediaType, MediaStatus } from '@ugc/database';
import { z } from 'zod';
import { getWorkspaceContext, hasPermission, addAuditLog } from '@/lib/workspace';
import { getStorageConfig } from '@/lib/env';

interface Params {
  params: { slug: string };
}

const uploadMediaSchema = z.object({
  ugcPostId: z.string().cuid().optional(),
  type: z.enum(['VIDEO', 'IMAGE']),
  originalUrl: z.string().url().optional(),
  filename: z.string().optional(),
});

// GET /api/workspaces/[slug]/media - List media assets
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
    const status = searchParams.get('status') as MediaStatus | null;
    const type = searchParams.get('type') as MediaType | null;

    const media = await prisma.mediaAsset.findMany({
      where: {
        workspaceId: context.workspaceId,
        ...(status && { status }),
        ...(type && { type }),
      },
      include: {
        ugcPost: { select: { id: true, creatorHandle: true, platform: true } },
        _count: { select: { repurposedClips: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ success: true, data: { media } });
  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch media' } },
      { status: 500 }
    );
  }
}

// POST /api/workspaces/[slug]/media - Create media asset (request upload URL or from URL)
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
    const validation = uploadMediaSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: validation.error.flatten().fieldErrors },
        },
        { status: 400 }
      );
    }

    const { ugcPostId, type, originalUrl, filename } = validation.data;

    // Verify UGC post belongs to workspace if provided
    if (ugcPostId) {
      const post = await prisma.ugcPost.findFirst({
        where: { id: ugcPostId, workspaceId: context.workspaceId },
      });
      if (!post) {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'UGC post not found' } },
          { status: 404 }
        );
      }
    }

    // Generate storage key
    const storageConfig = getStorageConfig();
    const timestamp = Date.now();
    const ext = type === 'VIDEO' ? 'mp4' : 'jpg';
    const storageKey = `${context.workspaceId}/${timestamp}-${filename || `media.${ext}`}`;

    // Create media asset record
    const media = await prisma.mediaAsset.create({
      data: {
        workspaceId: context.workspaceId,
        ugcPostId,
        type: type as MediaType,
        originalUrl,
        storageKey,
        status: originalUrl ? 'PENDING' : 'PENDING',
      },
    });

    // If originalUrl provided, queue download job
    // In a real implementation, this would queue a BullMQ job
    if (originalUrl) {
      // TODO: Queue download job
      // await queueMediaDownload(media.id, originalUrl);
    }

    await addAuditLog({
      workspaceId: context.workspaceId,
      userId: context.userId,
      action: 'CREATE',
      entityType: 'media_asset',
      entityId: media.id,
      newData: { type, originalUrl },
    });

    // Return upload URL for direct uploads (simplified - in production use presigned URLs)
    const uploadUrl = `${storageConfig.endpoint}/${storageConfig.bucket}/${storageKey}`;

    return NextResponse.json({
      success: true,
      data: {
        media,
        uploadUrl: originalUrl ? null : uploadUrl,
        storageKey,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating media:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create media' } },
      { status: 500 }
    );
  }
}
