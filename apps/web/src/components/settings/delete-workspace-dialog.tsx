/**
 * Delete Workspace Dialog component
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

interface DeleteWorkspaceDialogProps {
  slug: string;
  workspaceName: string;
}

export function DeleteWorkspaceDialog({ slug, workspaceName }: DeleteWorkspaceDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const canDelete = confirmText === workspaceName;

  async function handleDelete() {
    if (!canDelete) return;
    
    setIsLoading(true);

    try {
      const response = await fetch(`/api/workspaces/${slug}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: 'Failed to delete',
          description: data.error?.message || 'An error occurred',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Workspace deleted',
        description: 'Your workspace has been permanently deleted',
      });

      router.push('/dashboard');
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
      <Button variant="destructive" onClick={() => setIsOpen(true)}>
        Delete Workspace
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-destructive mb-2">Delete Workspace</h2>
          <p className="text-sm text-muted-foreground mb-4">
            This action is permanent and cannot be undone. All data including UGC posts, 
            products, rights requests, and analytics will be permanently deleted.
          </p>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="confirm">
                Type <strong>{workspaceName}</strong> to confirm
              </Label>
              <Input
                id="confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={workspaceName}
                disabled={isLoading}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete} 
                disabled={!canDelete || isLoading}
              >
                {isLoading ? 'Deleting...' : 'Delete Workspace'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
