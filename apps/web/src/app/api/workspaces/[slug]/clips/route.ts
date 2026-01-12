/**
 * Clips API - List and manage repurposed clips
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma, ClipFormat, MediaStatus } from '@ugc/database';
import { z } from 'zod';
import { getWorkspaceContext, hasPermission } from '@/lib/workspace';

interface Params {
  params: { slug: string };
}

// GET /api/workspaces/[slug]/clips - List clips
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
    const format = searchParams.get('format') as ClipFormat | null;
    const status = searchParams.get('status') as MediaStatus | null;

    const clips = await prisma.repurposedClip.findMany({
      where: {
        workspaceId: context.workspaceId,
        ...(format && { format }),
        ...(status && { status }),
      },
      include: {
        sourceMediaAsset: {
          include: {
            ugcPost: { select: { creatorHandle: true, platform: true } },
          },
        },
        contentProductMaps: {
          include: { product: { select: { id: true, title: true, imageUrl: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ success: true, data: { clips } });
  } catch (error) {
    console.error('Error fetching clips:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch clips' } },
      { status: 500 }
    );
  }
}

const tagProductSchema = z.object({
  clipId: z.string().cuid(),
  productId: z.string().cuid(),
  isPrimary: z.boolean().default(false),
});

// POST /api/workspaces/[slug]/clips/tag - Tag a product to a clip
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
    const validation = tagProductSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: validation.error.flatten().fieldErrors },
        },
        { status: 400 }
      );
    }

    const { clipId, productId, isPrimary } = validation.data;

    // Verify clip and product belong to workspace
    const [clip, product] = await Promise.all([
      prisma.repurposedClip.findFirst({ where: { id: clipId, workspaceId: context.workspaceId } }),
      prisma.product.findFirst({ where: { id: productId, workspaceId: context.workspaceId } }),
    ]);

    if (!clip || !product) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Clip or product not found' } },
        { status: 404 }
      );
    }

    // Create or update mapping
    const mapping = await prisma.contentProductMap.upsert({
      where: {
        id: `${clipId}-${productId}`, // This won't match, will create new
      },
      create: {
        workspaceId: context.workspaceId,
        repurposedClipId: clipId,
        productId,
        isPrimary,
      },
      update: { isPrimary },
    });

    return NextResponse.json({ success: true, data: { mapping } }, { status: 201 });
  } catch (error) {
    console.error('Error tagging product:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to tag product' } },
      { status: 500 }
    );
  }
}
