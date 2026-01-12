/**
 * Shoppable Page API - Get, update, delete, publish
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ugc/database';
import { z } from 'zod';
import { getWorkspaceContext, hasPermission, addAuditLog } from '@/lib/workspace';

interface Params {
  params: { slug: string; pageId: string };
}

const updatePageSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  campaignId: z.string().cuid().nullable().optional(),
  themeJson: z.record(z.unknown()).optional(),
  isPublic: z.boolean().optional(),
});

// GET /api/workspaces/[slug]/pages/[pageId]
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const context = await getWorkspaceContext(params.slug);
    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Workspace not found' } },
        { status: 404 }
      );
    }

    const page = await prisma.shoppablePage.findFirst({
      where: { id: params.pageId, workspaceId: context.workspaceId },
      include: {
        campaign: { select: { id: true, name: true, utmCampaign: true } },
        items: {
          include: {
            repurposedClip: {
              include: {
                sourceMediaAsset: {
                  include: {
                    ugcPost: { select: { creatorHandle: true, platform: true } },
                  },
                },
                contentProductMaps: {
                  include: { product: true },
                },
              },
            },
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!page) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Page not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: { page } });
  } catch (error) {
    console.error('Error fetching page:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch page' } },
      { status: 500 }
    );
  }
}

// PATCH /api/workspaces/[slug]/pages/[pageId]
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
    const validation = updatePageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: validation.error.flatten().fieldErrors },
        },
        { status: 400 }
      );
    }

    const existing = await prisma.shoppablePage.findFirst({
      where: { id: params.pageId, workspaceId: context.workspaceId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Page not found' } },
        { status: 404 }
      );
    }

    const { isPublic, themeJson, ...rest } = validation.data;

    const updateData: Record<string, unknown> = { ...rest };
    if (themeJson !== undefined) {
      updateData.themeJson = JSON.parse(JSON.stringify(themeJson));
    }
    if (isPublic !== undefined) {
      updateData.isPublic = isPublic;
      if (isPublic && !existing.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    const page = await prisma.shoppablePage.update({
      where: { id: params.pageId },
      data: updateData,
    });

    const action = isPublic === true && !existing.isPublic ? 'PUBLISH' : 
                   isPublic === false && existing.isPublic ? 'UNPUBLISH' : 'UPDATE';

    await addAuditLog({
      workspaceId: context.workspaceId,
      userId: context.userId,
      action,
      entityType: 'shoppable_page',
      entityId: page.id,
      oldData: { isPublic: existing.isPublic },
      newData: { isPublic: page.isPublic },
    });

    return NextResponse.json({ success: true, data: { page } });
  } catch (error) {
    console.error('Error updating page:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update page' } },
      { status: 500 }
    );
  }
}

// DELETE /api/workspaces/[slug]/pages/[pageId]
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

    const existing = await prisma.shoppablePage.findFirst({
      where: { id: params.pageId, workspaceId: context.workspaceId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Page not found' } },
        { status: 404 }
      );
    }

    await prisma.shoppablePage.delete({ where: { id: params.pageId } });

    await addAuditLog({
      workspaceId: context.workspaceId,
      userId: context.userId,
      action: 'DELETE',
      entityType: 'shoppable_page',
      entityId: params.pageId,
      oldData: { title: existing.title, slug: existing.slug },
    });

    return NextResponse.json({ success: true, data: { message: 'Page deleted' } });
  } catch (error) {
    console.error('Error deleting page:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete page' } },
      { status: 500 }
    );
  }
}
