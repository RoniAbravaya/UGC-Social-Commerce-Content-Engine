/**
 * Clip Actions - Preview and Export buttons for clips
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface ClipPreviewDialogProps {
  clip: {
    id: string;
    storageUrl: string | null;
    format: string;
    duration: number | null;
    thumbnailUrl: string | null;
    captionTrackUrl: string | null;
  };
  creatorHandle: string;
}

export function ClipPreviewDialog({ clip, creatorHandle }: ClipPreviewDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <Button size="sm" variant="outline" className="flex-1" onClick={() => setIsOpen(true)}>
        Preview
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Clip Preview</h3>
            <p className="text-sm text-muted-foreground">
              {clip.format.replace('_', ':')} • {clip.duration ? `${Math.round(clip.duration)}s` : 'N/A'} • @{creatorHandle}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            ✕
          </Button>
        </div>
        <div className="p-4">
          <div className="aspect-[9/16] max-h-[60vh] mx-auto bg-black rounded-lg flex items-center justify-center">
            {clip.storageUrl ? (
              <video 
                src={clip.storageUrl} 
                controls 
                className="max-h-full max-w-full rounded-lg"
                poster={clip.thumbnailUrl || undefined}
              >
                {clip.captionTrackUrl && (
                  <track kind="captions" src={clip.captionTrackUrl} label="Captions" default />
                )}
              </video>
            ) : (
              <div className="text-white/50 text-center p-8">
                <p className="text-lg mb-2">Preview not available</p>
                <p className="text-sm">Video is still processing or URL is not accessible</p>
              </div>
            )}
          </div>
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>Close</Button>
        </div>
      </div>
    </div>
  );
}

interface ClipExportButtonProps {
  clip: {
    id: string;
    storageUrl: string | null;
    format: string;
  };
  creatorHandle: string;
  slug: string;
}

export function ClipExportButton({ clip, creatorHandle, slug }: ClipExportButtonProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  async function handleDownload() {
    if (!clip.storageUrl) {
      toast({
        title: 'Download unavailable',
        description: 'The clip file is not ready for download',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);
    
    try {
      // Create download link
      const link = document.createElement('a');
      link.href = clip.storageUrl;
      link.download = `clip-${creatorHandle}-${clip.format}-${clip.id.slice(-6)}.mp4`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Download started',
        description: 'Your clip is being downloaded',
      });
      
      setIsOpen(false);
    } catch (error) {
      toast({
        title: 'Download failed',
        description: 'Unable to download the clip',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  }

  async function copyShareLink() {
    const shareUrl = `${window.location.origin}/api/workspaces/${slug}/clips/${clip.id}/share`;
    await navigator.clipboard.writeText(clip.storageUrl || shareUrl);
    toast({
      title: 'Link copied',
      description: 'Share link copied to clipboard',
    });
  }

  if (!isOpen) {
    return (
      <Button size="sm" className="flex-1" onClick={() => setIsOpen(true)}>
        Export
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-sm">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Export Clip</h3>
          <p className="text-sm text-muted-foreground">
            {clip.format.replace('_', ':')} format
          </p>
        </div>
        <div className="p-4 space-y-3">
          <Button 
            className="w-full justify-start" 
            variant="outline"
            onClick={handleDownload}
            disabled={isExporting || !clip.storageUrl}
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {isExporting ? 'Downloading...' : 'Download MP4'}
          </Button>
          <Button 
            className="w-full justify-start" 
            variant="outline"
            onClick={copyShareLink}
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            Copy Share Link
          </Button>
        </div>
        <div className="p-4 border-t">
          <Button variant="ghost" className="w-full" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

interface BrowseContentButtonProps {
  slug: string;
}

export function BrowseContentButton({ slug }: BrowseContentButtonProps) {
  return (
    <Button variant="outline" asChild>
      <a href={`/w/${slug}/ugc?status=APPROVED`}>Browse Approved Content</a>
    </Button>
  );
}
