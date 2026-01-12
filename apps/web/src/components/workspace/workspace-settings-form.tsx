/**
 * Workspace settings form component
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import type { Workspace } from '@ugc/database';

interface WorkspaceSettingsFormProps {
  workspace: Workspace;
  canEdit: boolean;
}

export function WorkspaceSettingsForm({ workspace, canEdit }: WorkspaceSettingsFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(workspace.name);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!canEdit) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/workspaces/${workspace.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: 'Failed to update workspace',
          description: data.error?.message || 'An error occurred',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Workspace updated',
        description: 'Your changes have been saved',
      });

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Workspace Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!canEdit || isLoading}
          placeholder="My Workspace"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Workspace URL</Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">ugc-commerce.com/w/</span>
          <Input
            id="slug"
            value={workspace.slug}
            disabled
            className="max-w-[200px]"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Workspace URL cannot be changed
        </p>
      </div>

      {canEdit && (
        <Button type="submit" disabled={isLoading || name === workspace.name}>
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      )}
    </form>
  );
}
