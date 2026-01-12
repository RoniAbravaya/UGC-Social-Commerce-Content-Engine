/**
 * Workspace header component with user menu
 */

import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { prisma } from '@ugc/database';
import { UserMenu } from './user-menu';
import { WorkspaceSwitcher } from './workspace-switcher';

interface WorkspaceHeaderProps {
  slug: string;
}

export async function WorkspaceHeader({ slug }: WorkspaceHeaderProps) {
  const session = await getSession();
  
  if (!session?.user) return null;

  const workspaces = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id },
    include: {
      workspace: {
        select: { id: true, name: true, slug: true, logoUrl: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const currentWorkspace = workspaces.find(w => w.workspace.slug === slug)?.workspace;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 lg:px-6">
        {/* Logo */}
        <Link href={`/w/${slug}`} className="flex items-center gap-2 mr-6">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold">U</span>
          </div>
          <span className="font-semibold hidden md:block">UGC Commerce</span>
        </Link>

        {/* Workspace Switcher */}
        <WorkspaceSwitcher 
          workspaces={workspaces.map(w => w.workspace)} 
          currentSlug={slug} 
        />

        {/* Spacer */}
        <div className="flex-1" />

        {/* User Menu */}
        <UserMenu user={session.user} />
      </div>
    </header>
  );
}
