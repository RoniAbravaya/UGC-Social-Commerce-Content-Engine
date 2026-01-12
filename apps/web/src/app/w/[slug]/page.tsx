/**
 * Workspace dashboard page - shows KPIs and overview
 */

import { prisma } from '@ugc/database';
import { getWorkspaceContext } from '@/lib/workspace';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber, formatCurrency } from '@ugc/shared';

interface DashboardPageProps {
  params: { slug: string };
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const context = await getWorkspaceContext(params.slug);
  
  if (!context) {
    return null; // Layout handles redirect
  }

  // Fetch dashboard stats
  const [
    ugcCount,
    rightsApproved,
    clipsCount,
    productsCount,
  ] = await Promise.all([
    prisma.ugcPost.count({ where: { workspaceId: context.workspaceId } }),
    prisma.rightsRequest.count({ 
      where: { workspaceId: context.workspaceId, status: 'APPROVED' } 
    }),
    prisma.repurposedClip.count({ where: { workspaceId: context.workspaceId } }),
    prisma.product.count({ where: { workspaceId: context.workspaceId } }),
  ]);

  // Calculate rights approval rate
  const totalRightsRequests = await prisma.rightsRequest.count({
    where: { workspaceId: context.workspaceId },
  });
  const approvalRate = totalRightsRequests > 0 
    ? Math.round((rightsApproved / totalRightsRequests) * 100) 
    : 0;

  const stats = [
    {
      title: 'UGC Posts',
      value: formatNumber(ugcCount),
      description: 'Total imported content',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'Rights Approved',
      value: `${approvalRate}%`,
      description: `${rightsApproved} of ${totalRightsRequests} requests`,
      trend: '+5%',
      trendUp: true,
    },
    {
      title: 'Clips Created',
      value: formatNumber(clipsCount),
      description: 'Repurposed content',
      trend: '+23%',
      trendUp: true,
    },
    {
      title: 'Products Tagged',
      value: formatNumber(productsCount),
      description: 'Shoppable products',
      trend: '+8%',
      trendUp: true,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your UGC performance and revenue attribution
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <span className={`text-xs ${stat.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                {stat.trend}
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Import UGC</CardTitle>
            <CardDescription>
              Add new user-generated content to your library
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a 
              href={`/w/${params.slug}/ugc?import=true`}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Import Content
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Manage Rights</CardTitle>
            <CardDescription>
              Review pending rights requests and approvals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a 
              href={`/w/${params.slug}/rights`}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
            >
              View Rights Center
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create Clips</CardTitle>
            <CardDescription>
              Repurpose approved content into platform-ready clips
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a 
              href={`/w/${params.slug}/repurpose`}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
            >
              Open Studio
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest actions in your workspace</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-8">
            No recent activity yet. Start by importing some UGC content!
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
