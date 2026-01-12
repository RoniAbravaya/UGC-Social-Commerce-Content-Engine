/**
 * UGC Feed page - displays imported user-generated content with import logs
 */

import { prisma } from '@ugc/database';
import { getWorkspaceContext } from '@/lib/workspace';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { formatNumber, formatRelativeTime } from '@ugc/shared';
import { ImportUgcDialog, CsvImportDialog } from '@/components/ugc/import-ugc-dialog';
import { ImportLogsButton } from '@/components/ugc/import-logs-button';

interface UgcPageProps {
  params: { slug: string };
}

export default async function UgcPage({ params }: UgcPageProps) {
  const context = await getWorkspaceContext(params.slug);
  
  if (!context) {
    return null;
  }

  const posts = await prisma.ugcPost.findMany({
    where: { workspaceId: context.workspaceId },
    include: {
      rightsRequest: {
        select: { status: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  // Get recent import logs summary
  const recentImports = await prisma.importLog.findMany({
    where: { workspaceId: context.workspaceId },
    orderBy: { createdAt: 'desc' },
    take: 3,
    select: {
      id: true,
      status: true,
      source: true,
      totalItems: true,
      succeeded: true,
      failed: true,
      createdAt: true,
    },
  });

  const platformColors: Record<string, string> = {
    TIKTOK: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
    INSTAGRAM: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    YOUTUBE: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    MANUAL: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    REQUESTED: 'bg-blue-100 text-blue-700',
    APPROVED: 'bg-green-100 text-green-700',
    DENIED: 'bg-red-100 text-red-700',
    EXPIRED: 'bg-gray-100 text-gray-700',
  };

  const hasFailedImports = recentImports.some(i => i.status === 'FAILED' || i.failed > 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">UGC Feed</h1>
          <p className="text-muted-foreground">
            Browse and manage imported user-generated content
          </p>
        </div>
        <div className="flex gap-2">
          <ImportLogsButton slug={params.slug} hasErrors={hasFailedImports} />
          <CsvImportDialog slug={params.slug} />
          <ImportUgcDialog slug={params.slug} />
        </div>
      </div>

      {/* Recent Import Status Banner */}
      {recentImports.length > 0 && recentImports[0].status === 'FAILED' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-red-600">❌</span>
            <span className="font-medium text-red-700">Recent import failed</span>
          </div>
        <p className="text-sm text-red-600 mt-1">
          Your last {recentImports[0].source} import encountered errors. 
          Click &quot;Import Logs&quot; to view details.
        </p>
        </div>
      )}

      {posts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground mb-4">No UGC posts yet</p>
            <div className="flex gap-2">
              <CsvImportDialog slug={params.slug} />
              <ImportUgcDialog slug={params.slug} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => {
            const metrics = post.metricsJson as { views?: number; likes?: number } | null;
            
            return (
              <Card key={post.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${platformColors[post.platform]}`}>
                      {post.platform}
                    </span>
                    {post.rightsRequest && (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[post.rightsRequest.status]}`}>
                        {post.rightsRequest.status}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {post.creatorHandle.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">@{post.creatorHandle}</p>
                        <p className="text-xs text-muted-foreground">
                          {post.postedAt ? formatRelativeTime(post.postedAt) : 'Unknown date'}
                        </p>
                      </div>
                    </div>
                    
                    <p className="text-sm line-clamp-2">
                      {post.caption || 'No caption'}
                    </p>
                    
                    {metrics && (
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        {metrics.views && <span>{formatNumber(metrics.views)} views</span>}
                        {metrics.likes && <span>{formatNumber(metrics.likes)} likes</span>}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1">
                      {post.hashtags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-xs text-primary">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
