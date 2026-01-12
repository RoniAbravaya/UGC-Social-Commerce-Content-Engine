/**
 * Workspace layout - provides navigation and workspace context
 */

import { redirect, notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getWorkspaceContext } from '@/lib/workspace';
import { WorkspaceNav } from '@/components/workspace/workspace-nav';
import { WorkspaceHeader } from '@/components/workspace/workspace-header';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  params: { slug: string };
}

export default async function WorkspaceLayout({ children, params }: WorkspaceLayoutProps) {
  const session = await getSession();
  
  if (!session?.user) {
    redirect('/auth/login');
  }

  const context = await getWorkspaceContext(params.slug);
  
  if (!context) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <WorkspaceHeader slug={params.slug} />
      <div className="flex">
        <WorkspaceNav slug={params.slug} role={context.role} />
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
