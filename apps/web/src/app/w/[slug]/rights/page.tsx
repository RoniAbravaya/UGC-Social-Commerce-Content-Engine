/**
 * Rights Center page - manage content usage permissions
 */

import { prisma } from '@ugc/database';
import { getWorkspaceContext } from '@/lib/workspace';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@ugc/shared';

interface RightsPageProps {
  params: { slug: string };
}

export default async function RightsPage({ params }: RightsPageProps) {
  const context = await getWorkspaceContext(params.slug);
  
  if (!context) {
    return null;
  }

  const rightsRequests = await prisma.rightsRequest.findMany({
    where: { workspaceId: context.workspaceId },
    include: {
      ugcPost: {
        select: {
          platform: true,
          creatorHandle: true,
          creatorName: true,
          caption: true,
          postUrl: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const statusGroups = {
    pending: rightsRequests.filter(r => r.status === 'PENDING'),
    requested: rightsRequests.filter(r => r.status === 'REQUESTED'),
    approved: rightsRequests.filter(r => r.status === 'APPROVED'),
    denied: rightsRequests.filter(r => r.status === 'DENIED'),
  };

  const statusColors: Record<string, string> = {
    PENDING: 'border-yellow-500',
    REQUESTED: 'border-blue-500',
    APPROVED: 'border-green-500',
    DENIED: 'border-red-500',
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Rights Center</h1>
        <p className="text-muted-foreground">
          Request and track content usage permissions from creators
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusGroups.pending.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Requested</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusGroups.requested.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statusGroups.approved.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statusGroups.denied.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Rights Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
          <CardDescription>
            {rightsRequests.length} total rights request{rightsRequests.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rightsRequests.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No rights requests yet. Import UGC to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {rightsRequests.map((request) => (
                <div 
                  key={request.id} 
                  className={`p-4 rounded-lg border-l-4 bg-muted/30 ${statusColors[request.status]}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">@{request.ugcPost.creatorHandle}</span>
                        <span className="text-xs text-muted-foreground">
                          {request.ugcPost.platform}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {request.ugcPost.caption || 'No caption'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created {formatRelativeTime(request.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        request.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        request.status === 'DENIED' ? 'bg-red-100 text-red-700' :
                        request.status === 'REQUESTED' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {request.status}
                      </span>
                      {request.status === 'PENDING' && (
                        <Button size="sm">Send Request</Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
