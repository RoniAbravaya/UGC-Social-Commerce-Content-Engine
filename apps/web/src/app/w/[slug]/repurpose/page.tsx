/**
 * Repurpose Studio page - create clips from source videos
 */

import { prisma } from '@ugc/database';
import { getWorkspaceContext } from '@/lib/workspace';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateClipsDialog } from '@/components/repurpose/create-clips-dialog';
import { ClipPreviewDialog, ClipExportButton, BrowseContentButton } from '@/components/repurpose/clip-actions';

interface RepurposePageProps {
  params: { slug: string };
}

export default async function RepurposePage({ params }: RepurposePageProps) {
  const context = await getWorkspaceContext(params.slug);
  
  if (!context) {
    return null;
  }

  const clips = await prisma.repurposedClip.findMany({
    where: { workspaceId: context.workspaceId },
    include: {
      sourceMediaAsset: {
        include: {
          ugcPost: {
            select: { creatorHandle: true, platform: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const jobs = await prisma.repurposeJob.findMany({
    where: { 
      workspaceId: context.workspaceId,
      status: { in: ['QUEUED', 'PROCESSING'] },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Repurpose Studio</h1>
          <p className="text-muted-foreground">
            Create platform-ready clips from your approved UGC content
          </p>
        </div>
        <CreateClipsDialog slug={params.slug} />
      </div>

      {/* Active Jobs */}
      {jobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Processing</CardTitle>
            <CardDescription>Jobs currently running</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {jobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Job #{job.id.slice(-6)}</p>
                    <p className="text-xs text-muted-foreground">{job.status}</p>
                  </div>
                  <div className="w-32 bg-muted-foreground/20 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all" 
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clips Library */}
      <Card>
        <CardHeader>
          <CardTitle>Clip Library</CardTitle>
          <CardDescription>
            {clips.length} clip{clips.length !== 1 ? 's' : ''} created
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clips.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No clips yet. Select approved UGC content to start creating clips.
              </p>
              <BrowseContentButton slug={params.slug} />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {clips.map((clip) => {
                const creatorHandle = clip.sourceMediaAsset?.ugcPost?.creatorHandle || 'unknown';
                
                return (
                  <div key={clip.id} className="rounded-lg border overflow-hidden">
                    <div className="aspect-[9/16] bg-muted flex items-center justify-center relative">
                      {clip.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={clip.thumbnailUrl} 
                          alt="Clip thumbnail"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-muted-foreground text-sm">Video Preview</span>
                      )}
                      {clip.status === 'PROCESSING' && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="text-white text-sm">Processing...</div>
                        </div>
                      )}
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-muted">
                          {clip.format.replace('_', ':')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {clip.duration ? `${Math.round(clip.duration)}s` : 'N/A'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        From @{creatorHandle}
                      </p>
                      <div className="flex gap-2">
                        <ClipPreviewDialog 
                          clip={{
                            id: clip.id,
                            storageUrl: clip.storageUrl,
                            format: clip.format,
                            duration: clip.duration,
                            thumbnailUrl: clip.thumbnailUrl,
                            captionTrackUrl: clip.captionTrackUrl,
                          }}
                          creatorHandle={creatorHandle}
                        />
                        <ClipExportButton 
                          clip={{
                            id: clip.id,
                            storageUrl: clip.storageUrl,
                            format: clip.format,
                          }}
                          creatorHandle={creatorHandle}
                          slug={params.slug}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
