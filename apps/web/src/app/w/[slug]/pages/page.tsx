/**
 * Shoppable Pages - create and manage UGC landing pages
 */

import { prisma } from '@ugc/database';
import { getWorkspaceContext } from '@/lib/workspace';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@ugc/shared';

interface PagesPageProps {
  params: { slug: string };
}

export default async function PagesPage({ params }: PagesPageProps) {
  const context = await getWorkspaceContext(params.slug);
  
  if (!context) {
    return null;
  }

  const pages = await prisma.shoppablePage.findMany({
    where: { workspaceId: context.workspaceId },
    include: {
      _count: { select: { items: true } },
      campaign: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shoppable Pages</h1>
          <p className="text-muted-foreground">
            Create UGC galleries with shoppable product links
          </p>
        </div>
        <Button>Create Page</Button>
      </div>

      {pages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground mb-4">No shoppable pages yet</p>
            <Button>Create Your First Page</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pages.map((page) => (
            <Card key={page.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{page.title}</CardTitle>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    page.isPublic 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {page.isPublic ? 'Published' : 'Draft'}
                  </span>
                </div>
                <CardDescription>
                  {page.campaign?.name || 'No campaign'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Content items</span>
                    <span>{page._count.items}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">URL</span>
                    <code className="text-xs bg-muted px-1 rounded">/g/{params.slug}/{page.slug}</code>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Updated</span>
                    <span>{formatRelativeTime(page.updatedAt)}</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">Edit</Button>
                    <Button variant="outline" size="sm" className="flex-1">Preview</Button>
                    <Button size="sm" className="flex-1">
                      {page.isPublic ? 'Unpublish' : 'Publish'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
