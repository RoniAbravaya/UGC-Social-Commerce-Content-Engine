/**
 * UGC Feed page - displays imported user-generated content
 */

import { prisma } from '@ugc/database';
import { getWorkspaceContext } from '@/lib/workspace';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatNumber, formatRelativeTime } from '@ugc/shared';

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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">UGC Feed</h1>
          <p className="text-muted-foreground">
            Browse and manage imported user-generated content
          </p>
        </div>
        <Button>Import UGC</Button>
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground mb-4">No UGC posts yet</p>
            <Button>Import Your First Post</Button>
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
