/**
 * Workspace switcher dropdown component
 */

'use client';

import { useRouter } from 'next/navigation';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

interface WorkspaceSwitcherProps {
  workspaces: Workspace[];
  currentSlug: string;
}

export function WorkspaceSwitcher({ workspaces, currentSlug }: WorkspaceSwitcherProps) {
  const router = useRouter();
  const currentWorkspace = workspaces.find(w => w.slug === currentSlug);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[200px] justify-between">
          <span className="truncate">{currentWorkspace?.name || 'Select workspace'}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px]" align="start">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {workspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            onClick={() => router.push(`/w/${workspace.slug}`)}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-2 w-full">
              <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-medium text-primary">
                  {workspace.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="truncate flex-1">{workspace.name}</span>
              {workspace.slug === currentSlug && (
                <Check className="h-4 w-4 shrink-0" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push('/onboarding')}
          className="cursor-pointer"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
