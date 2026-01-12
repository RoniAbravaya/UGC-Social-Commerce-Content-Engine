/**
 * Create Clips Dialog - Select source video and configure clip generation
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

interface MediaAsset {
  id: string;
  filename: string | null;
  duration: number | null;
  status: string;
  ugcPost?: {
    creatorHandle: string;
    platform: string;
    caption: string | null;
  } | null;
}

interface CreateClipsDialogProps {
  slug: string;
}

export function CreateClipsDialog({ slug }: CreateClipsDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [clipSettings, setClipSettings] = useState({
    shortClip: true,
    mediumClip: true,
    longClip: false,
    format9_16: true,
    format1_1: false,
    format16_9: false,
    autoCaption: true,
  });

  useEffect(() => {
    if (isOpen && mediaAssets.length === 0) {
      fetchMediaAssets();
    }
  }, [isOpen]);

  async function fetchMediaAssets() {
    setIsFetching(true);
    try {
      const response = await fetch(`/api/workspaces/${slug}/media?status=READY&type=VIDEO`);
      const data = await response.json();
      if (data.success) {
        setMediaAssets(data.data.assets || []);
      }
    } catch (error) {
      console.error('Failed to fetch media assets:', error);
    } finally {
      setIsFetching(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!selectedAssetId) {
      toast({
        title: 'Select a video',
        description: 'Please select a source video to create clips from',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    const clipDurations: number[] = [];
    if (clipSettings.shortClip) clipDurations.push(10);
    if (clipSettings.mediumClip) clipDurations.push(20);
    if (clipSettings.longClip) clipDurations.push(30);

    const formats: string[] = [];
    if (clipSettings.format9_16) formats.push('9_16');
    if (clipSettings.format1_1) formats.push('1_1');
    if (clipSettings.format16_9) formats.push('16_9');

    try {
      const response = await fetch(`/api/workspaces/${slug}/repurpose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceMediaAssetId: selectedAssetId,
          params: {
            clipDurations,
            formats,
            autoCaption: clipSettings.autoCaption,
            captionStyle: 'default',
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: 'Failed to create job',
          description: data.error?.message || 'An error occurred',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Job created',
        description: 'Your clip generation job has been queued',
      });

      setIsOpen(false);
      setSelectedAssetId('');
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)}>Create Clips</Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-2">Create Clips</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Select a source video and configure clip settings
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Source Video Selection */}
            <div className="space-y-2">
              <Label>Source Video *</Label>
              {isFetching ? (
                <p className="text-sm text-muted-foreground">Loading videos...</p>
              ) : mediaAssets.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No videos available. Import UGC with video content first.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                  {mediaAssets.map((asset) => (
                    <label
                      key={asset.id}
                      className={`flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-muted ${
                        selectedAssetId === asset.id ? 'bg-primary/10 border border-primary' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="sourceAsset"
                        value={asset.id}
                        checked={selectedAssetId === asset.id}
                        onChange={(e) => setSelectedAssetId(e.target.value)}
                        className="sr-only"
                      />
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-xs">
                        Video
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {asset.ugcPost ? `@${asset.ugcPost.creatorHandle}` : asset.filename || 'Untitled'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {asset.duration ? `${Math.round(asset.duration)}s` : 'Duration unknown'}
                          {asset.ugcPost && ` • ${asset.ugcPost.platform}`}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Clip Duration Options */}
            <div className="space-y-2">
              <Label>Clip Durations</Label>
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={clipSettings.shortClip}
                    onChange={(e) => setClipSettings({ ...clipSettings, shortClip: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Short (6-12s)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={clipSettings.mediumClip}
                    onChange={(e) => setClipSettings({ ...clipSettings, mediumClip: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Medium (12-20s)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={clipSettings.longClip}
                    onChange={(e) => setClipSettings({ ...clipSettings, longClip: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Long (20-35s)</span>
                </label>
              </div>
            </div>

            {/* Format Options */}
            <div className="space-y-2">
              <Label>Output Formats</Label>
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={clipSettings.format9_16}
                    onChange={(e) => setClipSettings({ ...clipSettings, format9_16: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">9:16 (TikTok/Reels)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={clipSettings.format1_1}
                    onChange={(e) => setClipSettings({ ...clipSettings, format1_1: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">1:1 (Feed)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={clipSettings.format16_9}
                    onChange={(e) => setClipSettings({ ...clipSettings, format16_9: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">16:9 (YouTube)</span>
                </label>
              </div>
            </div>

            {/* Caption Options */}
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={clipSettings.autoCaption}
                  onChange={(e) => setClipSettings({ ...clipSettings, autoCaption: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm font-medium">Auto-generate captions</span>
              </label>
              <p className="text-xs text-muted-foreground ml-6">
                Automatically transcribe and add captions to clips
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !selectedAssetId}>
                {isLoading ? 'Creating...' : 'Start Processing'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
