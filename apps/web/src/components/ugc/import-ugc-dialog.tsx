/**
 * Import UGC Dialog component with logging
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { ImportStatus, ImportLogsPanel } from './import-logs-panel';

interface ImportUgcDialogProps {
  slug: string;
}

export function ImportUgcDialog({ slug }: ImportUgcDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [lastImportLogId, setLastImportLogId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    postUrl: '',
    platform: 'TIKTOK' as const,
    creatorHandle: '',
    caption: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setLastImportLogId(null);

    try {
      const response = await fetch(`/api/workspaces/${slug}/ugc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      // Store the import log ID for status display
      if (data.importLogId) {
        setLastImportLogId(data.importLogId);
      }

      if (!response.ok) {
        toast({
          title: 'Import failed',
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
      router.refresh();
      
      // Keep dialog open briefly to show success status
      setTimeout(() => {
        setIsOpen(false);
        setLastImportLogId(null);
      }, 2000);
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

  if (showLogs) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl h-[80vh]">
          <ImportLogsPanel 
            slug={slug} 
            onClose={() => setShowLogs(false)} 
            currentLogId={lastImportLogId}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Import UGC</h2>
              <p className="text-sm text-muted-foreground">
                Add user-generated content from social platforms
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowLogs(true)}>
              📋 Logs
            </Button>
          </div>
          
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
                placeholder="Optional caption with #hashtags"
                disabled={isLoading}
              />
            </div>

            {/* Import Status Display */}
            {lastImportLogId && (
              <ImportStatus 
                logId={lastImportLogId} 
                slug={slug} 
                onViewLogs={() => setShowLogs(true)} 
              />
            )}

            <div className="flex gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsOpen(false);
                  setLastImportLogId(null);
                }} 
                disabled={isLoading}
              >
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

/**
 * CSV Import Dialog with logging
 */
interface CsvImportDialogProps {
  slug: string;
}

export function CsvImportDialog({ slug }: CsvImportDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [lastImportLogId, setLastImportLogId] = useState<string | null>(null);
  const [csvData, setCsvData] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setLastImportLogId(null);

    try {
      // Parse CSV
      const lines = csvData.trim().split('\n');
      if (lines.length < 2) {
        toast({
          title: 'Invalid CSV',
          description: 'CSV must have a header row and at least one data row',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
      const rows = lines.slice(1).map(line => {
        const values = line.split(',');
        const row: Record<string, string> = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx]?.trim() || '';
        });
        return row;
      });

      const response = await fetch(`/api/workspaces/${slug}/ugc/import/csv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });

      const data = await response.json();

      if (data.importLogId) {
        setLastImportLogId(data.importLogId);
      }

      if (!response.ok) {
        toast({
          title: 'Import failed',
          description: data.error?.message || 'An error occurred',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'CSV Import Complete',
        description: data.data.message,
      });

      setCsvData('');
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
      <Button variant="outline" onClick={() => setIsOpen(true)}>Import CSV</Button>
    );
  }

  if (showLogs) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl h-[80vh]">
          <ImportLogsPanel 
            slug={slug} 
            onClose={() => setShowLogs(false)} 
            currentLogId={lastImportLogId}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Import CSV</h2>
              <p className="text-sm text-muted-foreground">
                Bulk import UGC posts from a CSV file
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowLogs(true)}>
              📋 Logs
            </Button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="csv">CSV Data</Label>
              <textarea
                id="csv"
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                placeholder={`post_url,platform,creator_handle,creator_name,caption,hashtags
https://tiktok.com/@user/video/123,TIKTOK,user,User Name,Great content!,ugc,brand
https://instagram.com/p/abc,INSTAGRAM,creator,Creator,Amazing!,fashion`}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Required columns: post_url, platform, creator_handle
              </p>
            </div>

            {/* Import Status Display */}
            {lastImportLogId && (
              <ImportStatus 
                logId={lastImportLogId} 
                slug={slug} 
                onViewLogs={() => setShowLogs(true)} 
              />
            )}

            <div className="flex gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsOpen(false);
                  setLastImportLogId(null);
                }} 
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !csvData.trim()}>
                {isLoading ? 'Importing...' : 'Import CSV'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
