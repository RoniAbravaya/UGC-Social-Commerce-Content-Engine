/**
 * Import UGC Dialog component
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

interface ImportUgcDialogProps {
  slug: string;
}

export function ImportUgcDialog({ slug }: ImportUgcDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    postUrl: '',
    platform: 'TIKTOK' as const,
    creatorHandle: '',
    caption: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/workspaces/${slug}/ugc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: 'Failed to import',
          description: data.error?.message || 'An error occurred',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'UGC imported',
        description: 'Content has been added to your library',
      });

      setFormData({ postUrl: '', platform: 'TIKTOK', creatorHandle: '', caption: '' });
      setIsOpen(false);
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
      <Button onClick={() => setIsOpen(true)}>Import UGC</Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-2">Import UGC</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Add user-generated content from social platforms
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="platform">Platform *</Label>
              <select
                id="platform"
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value as any })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={isLoading}
              >
                <option value="TIKTOK">TikTok</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="YOUTUBE">YouTube</option>
                <option value="MANUAL">Manual</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="postUrl">Post URL *</Label>
              <Input
                id="postUrl"
                type="url"
                value={formData.postUrl}
                onChange={(e) => setFormData({ ...formData, postUrl: e.target.value })}
                placeholder="https://tiktok.com/@user/video/123"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="creatorHandle">Creator Handle *</Label>
              <Input
                id="creatorHandle"
                value={formData.creatorHandle}
                onChange={(e) => setFormData({ ...formData, creatorHandle: e.target.value })}
                placeholder="@username"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="caption">Caption</Label>
              <Input
                id="caption"
                value={formData.caption}
                onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                placeholder="Optional caption"
                disabled={isLoading}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Importing...' : 'Import'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
