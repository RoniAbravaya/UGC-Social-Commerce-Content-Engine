/**
 * Events API - Track analytics events
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma, EventType } from '@ugc/database';
import { z } from 'zod';
import { getWorkspaceContext } from '@/lib/workspace';

interface Params {
  params: { slug: string };
}

const trackEventSchema = z.object({
  type: z.enum(['PAGE_VIEW', 'VIDEO_VIEW', 'VIDEO_PLAY', 'VIDEO_COMPLETE', 'PRODUCT_CLICK', 'ADD_TO_CART', 'CHECKOUT_START', 'PURCHASE']),
  sessionId: z.string().optional(),
  visitorId: z.string().optional(),
  pageUrl: z.string().optional(),
  referrer: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmContent: z.string().optional(),
  utmTerm: z.string().optional(),
  ugcPostId: z.string().cuid().optional(),
  repurposedClipId: z.string().cuid().optional(),
  shoppablePageId: z.string().cuid().optional(),
  productId: z.string().cuid().optional(),
  revenueAmount: z.number().optional(),
  revenueCurrency: z.string().optional(),
  orderId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// POST /api/workspaces/[slug]/events - Track an event
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const context = await getWorkspaceContext(params.slug);
    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Workspace not found' } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = trackEventSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid event data', details: validation.error.flatten().fieldErrors },
        },
        { status: 400 }
      );
    }

    const eventData = validation.data;
    
    // Get user agent and IP from headers
    const userAgent = request.headers.get('user-agent') || undefined;
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || undefined;

    const event = await prisma.event.create({
      data: {
        workspaceId: context.workspaceId,
        type: eventData.type as EventType,
        sessionId: eventData.sessionId,
        visitorId: eventData.visitorId,
        userAgent,
        ipAddress,
        referrer: eventData.referrer,
        pageUrl: eventData.pageUrl,
        utmSource: eventData.utmSource,
        utmMedium: eventData.utmMedium,
        utmCampaign: eventData.utmCampaign,
        utmContent: eventData.utmContent,
        utmTerm: eventData.utmTerm,
        ugcPostId: eventData.ugcPostId,
        repurposedClipId: eventData.repurposedClipId,
        shoppablePageId: eventData.shoppablePageId,
        productId: eventData.productId,
        revenueAmount: eventData.revenueAmount,
        revenueCurrency: eventData.revenueCurrency,
        orderId: eventData.orderId,
        metadata: eventData.metadata ? JSON.parse(JSON.stringify(eventData.metadata)) : undefined,
      },
    });

    return NextResponse.json({ success: true, data: { eventId: event.id } }, { status: 201 });
  } catch (error) {
    console.error('Error tracking event:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to track event' } },
      { status: 500 }
    );
  }
}

// GET /api/workspaces/[slug]/events - List recent events
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
    const type = searchParams.get('type');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

    const events = await prisma.event.findMany({
      where: {
        workspaceId: context.workspaceId,
        ...(type && { type: type as EventType }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ success: true, data: { events } });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch events' } },
      { status: 500 }
    );
  }
}
