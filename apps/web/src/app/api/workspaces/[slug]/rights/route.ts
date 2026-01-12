/**
 * Rights Requests API - List and create rights requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ugc/database';
import { createRightsRequestSchema, paginationSchema, rightsStatusSchema } from '@ugc/shared';
import { getWorkspaceContext, hasPermission, addAuditLog } from '@/lib/workspace';

interface Params {
  params: { slug: string };
}

// GET /api/workspaces/[slug]/rights - List rights requests
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
    const pagination = paginationSchema.parse({
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    });
    const statusFilter = searchParams.get('status');
    const status = statusFilter ? rightsStatusSchema.parse(statusFilter) : undefined;

    const where = {
      workspaceId: context.workspaceId,
      ...(status && { status }),
    };

    const [requests, total] = await Promise.all([
      prisma.rightsRequest.findMany({
        where,
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
        orderBy: { createdAt: 'desc' },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      prisma.rightsRequest.count({ where }),
    ]);

    // Get status counts
    const statusCounts = await prisma.rightsRequest.groupBy({
      by: ['status'],
      where: { workspaceId: context.workspaceId },
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        items: requests,
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
        hasMore: pagination.page * pagination.limit < total,
        statusCounts: statusCounts.reduce((acc, s) => ({ ...acc, [s.status]: s._count }), {}),
      },
    });
  } catch (error) {
    console.error('Error fetching rights requests:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch requests' } },
      { status: 500 }
    );
  }
}

// POST /api/workspaces/[slug]/rights - Create a rights request (send request)
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
    const validation = createRightsRequestSchema.safeParse(body);

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

    const { ugcPostId, requestMessage, requestMethod } = validation.data;

    // Verify post belongs to workspace
    const post = await prisma.ugcPost.findFirst({
      where: { id: ugcPostId, workspaceId: context.workspaceId },
      include: { rightsRequest: true },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Post not found' } },
        { status: 404 }
      );
    }

    // Update existing request or create new one
    const rightsRequest = await prisma.rightsRequest.upsert({
      where: { ugcPostId },
      create: {
        workspaceId: context.workspaceId,
        ugcPostId,
        status: 'REQUESTED',
        requestMessage,
        requestMethod,
        requestSentAt: new Date(),
      },
      update: {
        status: 'REQUESTED',
        requestMessage,
        requestMethod,
        requestSentAt: new Date(),
      },
    });

    await addAuditLog({
      workspaceId: context.workspaceId,
      userId: context.userId,
      action: 'UPDATE',
      entityType: 'rights_request',
      entityId: rightsRequest.id,
      newData: { status: 'REQUESTED', ugcPostId },
    });

    return NextResponse.json({ success: true, data: { rightsRequest } }, { status: 201 });
  } catch (error) {
    console.error('Error creating rights request:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create request' } },
      { status: 500 }
    );
  }
}
