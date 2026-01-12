/**
 * Analytics API - Get analytics summary and metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ugc/database';
import { getWorkspaceContext } from '@/lib/workspace';

interface Params {
  params: { slug: string };
}

// GET /api/workspaces/[slug]/analytics
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
    const days = parseInt(searchParams.get('days') || '30', 10);
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const where = {
      workspaceId: context.workspaceId,
      createdAt: { gte: fromDate },
    };

    // Get event counts by type
    const eventCounts = await prisma.event.groupBy({
      by: ['type'],
      where,
      _count: true,
    });

    // Get total revenue
    const revenue = await prisma.event.aggregate({
      where: { ...where, type: 'PURCHASE' },
      _sum: { revenueAmount: true },
    });

    // Get daily metrics
    const dailyEvents = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        type,
        COUNT(*) as count,
        SUM(CASE WHEN type = 'PURCHASE' THEN revenue_amount ELSE 0 END) as revenue
      FROM events
      WHERE workspace_id = ${context.workspaceId}
        AND created_at >= ${fromDate}
      GROUP BY DATE(created_at), type
      ORDER BY date DESC
    `;

    // Get top content by views
    const topContent = await prisma.event.groupBy({
      by: ['repurposedClipId'],
      where: { ...where, type: 'VIDEO_VIEW', repurposedClipId: { not: null } },
      _count: true,
      orderBy: { _count: { repurposedClipId: 'desc' } },
      take: 10,
    });

    // Get top products by clicks
    const topProducts = await prisma.event.groupBy({
      by: ['productId'],
      where: { ...where, type: 'PRODUCT_CLICK', productId: { not: null } },
      _count: true,
      orderBy: { _count: { productId: 'desc' } },
      take: 10,
    });

    // Get UTM campaign breakdown
    const campaignBreakdown = await prisma.event.groupBy({
      by: ['utmCampaign'],
      where: { ...where, utmCampaign: { not: null } },
      _count: true,
      _sum: { revenueAmount: true },
      orderBy: { _count: { utmCampaign: 'desc' } },
      take: 10,
    });

    const countsByType = eventCounts.reduce((acc, e) => ({ ...acc, [e.type]: e._count }), {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalViews: countsByType['VIDEO_VIEW'] || 0,
          totalClicks: countsByType['PRODUCT_CLICK'] || 0,
          totalPurchases: countsByType['PURCHASE'] || 0,
          totalRevenue: revenue._sum.revenueAmount ? Number(revenue._sum.revenueAmount) : 0,
          conversionRate: countsByType['PRODUCT_CLICK'] > 0 
            ? ((countsByType['PURCHASE'] || 0) / countsByType['PRODUCT_CLICK'] * 100).toFixed(2) 
            : 0,
        },
        eventCounts: countsByType,
        dailyEvents,
        topContent,
        topProducts,
        campaignBreakdown,
        period: { days, from: fromDate.toISOString() },
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch analytics' } },
      { status: 500 }
    );
  }
}
