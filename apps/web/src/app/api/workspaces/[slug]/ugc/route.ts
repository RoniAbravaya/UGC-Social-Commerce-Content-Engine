/**
 * UGC Posts API - List and import UGC content
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ugc/database';
import { ugcPostFiltersSchema, importUgcManualSchema } from '@ugc/shared';
import { getWorkspaceContext, hasPermission, addAuditLog } from '@/lib/workspace';

interface Params {
  params: { slug: string };
}

// GET /api/workspaces/[slug]/ugc - List UGC posts
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
    const filters = ugcPostFiltersSchema.parse({
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
      platform: searchParams.get('platform'),
      rightsStatus: searchParams.get('rightsStatus'),
      creatorHandle: searchParams.get('creatorHandle'),
      hashtag: searchParams.get('hashtag'),
      search: searchParams.get('search'),
      from: searchParams.get('from'),
      to: searchParams.get('to'),
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    });

    const where: Record<string, unknown> = {
      workspaceId: context.workspaceId,
      ...(filters.platform && { platform: filters.platform }),
      ...(filters.creatorHandle && { 
        creatorHandle: { contains: filters.creatorHandle, mode: 'insensitive' } 
      }),
      ...(filters.hashtag && { hashtags: { has: filters.hashtag.toLowerCase() } }),
      ...(filters.search && {
        OR: [
          { caption: { contains: filters.search, mode: 'insensitive' } },
          { creatorHandle: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
      ...(filters.from && { postedAt: { gte: filters.from } }),
      ...(filters.to && { postedAt: { lte: filters.to } }),
    };

    // Filter by rights status if specified
    if (filters.rightsStatus) {
      where.rightsRequest = { status: filters.rightsStatus };
    }

    const [posts, total] = await Promise.all([
      prisma.ugcPost.findMany({
        where,
        include: {
          rightsRequest: { select: { id: true, status: true } },
          mediaAssets: { select: { id: true, type: true, status: true, storageUrl: true } },
          _count: { select: { contentProductMaps: true } },
        },
        orderBy: { [filters.sortBy]: filters.sortOrder },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.ugcPost.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: posts,
        total,
        page: filters.page,
        limit: filters.limit,
        totalPages: Math.ceil(total / filters.limit),
        hasMore: filters.page * filters.limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching UGC posts:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch posts' } },
      { status: 500 }
    );
  }
}

// POST /api/workspaces/[slug]/ugc - Import a UGC post manually
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
    const validation = importUgcManualSchema.safeParse(body);

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

    const { postUrl, platform, creatorHandle, creatorName, caption, hashtags, postedAt } = validation.data;

    // Check if already imported
    const existing = await prisma.ugcPost.findFirst({
      where: { workspaceId: context.workspaceId, platform, postUrl },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE', message: 'This post has already been imported' } },
        { status: 409 }
      );
    }

    // Extract hashtags from caption if not provided
    const extractedHashtags = hashtags || (caption?.match(/#[\w]+/g)?.map(t => t.slice(1).toLowerCase()) || []);

    const post = await prisma.ugcPost.create({
      data: {
        workspaceId: context.workspaceId,
        platform,
        postUrl,
        creatorHandle,
        creatorName,
        caption,
        hashtags: extractedHashtags,
        postedAt,
        importSource: 'manual',
      },
      include: {
        rightsRequest: true,
      },
    });

    // Auto-create a pending rights request
    await prisma.rightsRequest.create({
      data: {
        workspaceId: context.workspaceId,
        ugcPostId: post.id,
        status: 'PENDING',
      },
    });

    await addAuditLog({
      workspaceId: context.workspaceId,
      userId: context.userId,
      action: 'CREATE',
      entityType: 'ugc_post',
      entityId: post.id,
      newData: { creatorHandle, platform },
    });

    return NextResponse.json({ success: true, data: { post } }, { status: 201 });
  } catch (error) {
    console.error('Error importing UGC post:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to import post' } },
      { status: 500 }
    );
  }
}
