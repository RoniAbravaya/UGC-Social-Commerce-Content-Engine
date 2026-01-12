/**
 * UGC Post API - Get, update, delete a specific post
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ugc/database';
import { getWorkspaceContext, hasPermission, addAuditLog } from '@/lib/workspace';

interface Params {
  params: { slug: string; postId: string };
}

// GET /api/workspaces/[slug]/ugc/[postId]
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const context = await getWorkspaceContext(params.slug);
    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Workspace not found' } },
        { status: 404 }
      );
    }

    const post = await prisma.ugcPost.findFirst({
      where: { id: params.postId, workspaceId: context.workspaceId },
      include: {
        rightsRequest: true,
        mediaAssets: true,
        contentProductMaps: {
          include: {
            product: { select: { id: true, title: true, price: true, imageUrl: true } },
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Post not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: { post } });
  } catch (error) {
    console.error('Error fetching UGC post:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch post' } },
      { status: 500 }
    );
  }
}

// DELETE /api/workspaces/[slug]/ugc/[postId]
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

    const post = await prisma.ugcPost.findFirst({
      where: { id: params.postId, workspaceId: context.workspaceId },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Post not found' } },
        { status: 404 }
      );
    }

    await prisma.ugcPost.delete({ where: { id: params.postId } });

    await addAuditLog({
      workspaceId: context.workspaceId,
      userId: context.userId,
      action: 'DELETE',
      entityType: 'ugc_post',
      entityId: params.postId,
      oldData: { creatorHandle: post.creatorHandle },
    });

    return NextResponse.json({ success: true, data: { message: 'Post deleted' } });
  } catch (error) {
    console.error('Error deleting UGC post:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete post' } },
      { status: 500 }
    );
  }
}
