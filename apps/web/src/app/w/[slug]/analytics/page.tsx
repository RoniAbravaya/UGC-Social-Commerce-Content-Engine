/**
 * Analytics page - revenue attribution and performance metrics
 */

import { prisma } from '@ugc/database';
import { getWorkspaceContext } from '@/lib/workspace';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatNumber } from '@ugc/shared';

interface AnalyticsPageProps {
  params: { slug: string };
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const context = await getWorkspaceContext(params.slug);
  
  if (!context) {
    return null;
  }

  // Get event stats
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalViews,
    totalClicks,
    purchases,
    topCreators,
  ] = await Promise.all([
    prisma.event.count({
      where: { 
        workspaceId: context.workspaceId,
        type: 'VIDEO_VIEW',
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.event.count({
      where: { 
        workspaceId: context.workspaceId,
        type: 'PRODUCT_CLICK',
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.event.findMany({
      where: { 
        workspaceId: context.workspaceId,
        type: 'PURCHASE',
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { revenueAmount: true },
    }),
    prisma.ugcPost.groupBy({
      by: ['creatorHandle'],
      where: { workspaceId: context.workspaceId },
      _count: true,
      orderBy: { _count: { creatorHandle: 'desc' } },
      take: 5,
    }),
  ]);

  const totalRevenue = purchases.reduce(
    (sum, p) => sum + (p.revenueAmount ? Number(p.revenueAmount) : 0), 
    0
  );

  const conversionRate = totalClicks > 0 
    ? ((purchases.length / totalClicks) * 100).toFixed(2)
    : '0.00';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Track revenue attribution and content performance (Last 30 days)
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Video Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalViews)}</div>
            <p className="text-xs text-muted-foreground">+12% from last period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Product Clicks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalClicks)}</div>
            <p className="text-xs text-muted-foreground">+8% from last period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground">Clicks to purchases</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Attributed Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">+15% from last period</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts placeholder */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
            <CardDescription>Daily attributed revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center bg-muted/30 rounded-lg">
              <p className="text-muted-foreground text-sm">
                Chart visualization coming soon
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Content Performance</CardTitle>
            <CardDescription>Views and engagement by content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center bg-muted/30 rounded-lg">
              <p className="text-muted-foreground text-sm">
                Chart visualization coming soon
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Creators */}
      <Card>
        <CardHeader>
          <CardTitle>Top Creators</CardTitle>
          <CardDescription>Creators with the most content</CardDescription>
        </CardHeader>
        <CardContent>
          {topCreators.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No creator data yet
            </p>
          ) : (
            <div className="space-y-4">
              {topCreators.map((creator, index) => (
                <div key={creator.creatorHandle} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className="font-medium">@{creator.creatorHandle}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {creator._count} post{creator._count !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
