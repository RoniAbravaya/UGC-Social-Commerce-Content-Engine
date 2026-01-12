/**
 * Campaigns API - List and create campaigns
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ugc/database';
import { z } from 'zod';
import { getWorkspaceContext, hasPermission, addAuditLog } from '@/lib/workspace';

interface Params {
  params: { slug: string };
}

const createCampaignSchema = z.object({
  name: z.string().min(1).max(255),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().min(1),
  utmContent: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  isActive: z.boolean().default(true),
});

// GET /api/workspaces/[slug]/campaigns
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const context = await getWorkspaceContext(params.slug);
    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Workspace not found' } },
        { status: 404 }
      );
    }

    const campaigns = await prisma.campaign.findMany({
      where: { workspaceId: context.workspaceId },
      include: {
        _count: { select: { shoppablePages: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: { campaigns } });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch campaigns' } },
      { status: 500 }
    );
  }
}

// POST /api/workspaces/[slug]/campaigns
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
    const validation = createCampaignSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: validation.error.flatten().fieldErrors },
        },
        { status: 400 }
      );
    }

    const campaign = await prisma.campaign.create({
      data: {
        workspaceId: context.workspaceId,
        ...validation.data,
      },
    });

    await addAuditLog({
      workspaceId: context.workspaceId,
      userId: context.userId,
      action: 'CREATE',
      entityType: 'campaign',
      entityId: campaign.id,
      newData: { name: campaign.name },
    });

    return NextResponse.json({ success: true, data: { campaign } }, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create campaign' } },
      { status: 500 }
    );
  }
}
