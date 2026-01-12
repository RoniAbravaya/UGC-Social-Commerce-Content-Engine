/**
 * Shoppable Pages API - List and create pages
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ugc/database';
import { z } from 'zod';
import { slugSchema } from '@ugc/shared';
import { generateSlug } from '@ugc/shared';
import { getWorkspaceContext, hasPermission, addAuditLog } from '@/lib/workspace';

interface Params {
  params: { slug: string };
}

const createPageSchema = z.object({
  title: z.string().min(1).max(255),
  slug: slugSchema.optional(),
  description: z.string().optional(),
  campaignId: z.string().cuid().optional(),
  themeJson: z.record(z.unknown()).optional(),
  isPublic: z.boolean().default(false),
});

// GET /api/workspaces/[slug]/pages
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const context = await getWorkspaceContext(params.slug);
    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Workspace not found' } },
        { status: 404 }
      );
    }

    const pages = await prisma.shoppablePage.findMany({
      where: { workspaceId: context.workspaceId },
      include: {
        campaign: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: { pages } });
  } catch (error) {
    console.error('Error fetching pages:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch pages' } },
      { status: 500 }
    );
  }
}

// POST /api/workspaces/[slug]/pages
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
    const validation = createPageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: validation.error.flatten().fieldErrors },
        },
        { status: 400 }
      );
    }

    const { title, description, campaignId, themeJson, isPublic } = validation.data;
    
    // Generate unique slug
    let pageSlug = validation.data.slug || generateSlug(title);
    let counter = 1;
    while (await prisma.shoppablePage.findFirst({ 
      where: { workspaceId: context.workspaceId, slug: pageSlug } 
    })) {
      pageSlug = `${generateSlug(title)}-${counter}`;
      counter++;
    }

    const page = await prisma.shoppablePage.create({
      data: {
        workspaceId: context.workspaceId,
        slug: pageSlug,
        title,
        description,
        campaignId,
        themeJson: themeJson ? JSON.parse(JSON.stringify(themeJson)) : undefined,
        isPublic,
        publishedAt: isPublic ? new Date() : null,
      },
    });

    await addAuditLog({
      workspaceId: context.workspaceId,
      userId: context.userId,
      action: 'CREATE',
      entityType: 'shoppable_page',
      entityId: page.id,
      newData: { title: page.title, slug: page.slug },
    });

    return NextResponse.json({ success: true, data: { page } }, { status: 201 });
  } catch (error) {
    console.error('Error creating page:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create page' } },
      { status: 500 }
    );
  }
}
