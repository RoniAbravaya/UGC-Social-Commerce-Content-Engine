/**
 * Workspace navigation sidebar
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Video, 
  Shield, 
  Scissors, 
  ShoppingBag, 
  FileVideo, 
  BarChart3, 
  Settings,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkspaceRole } from '@ugc/database';

interface WorkspaceNavProps {
  slug: string;
  role: WorkspaceRole;
}

export function WorkspaceNav({ slug, role }: WorkspaceNavProps) {
  const pathname = usePathname();
  const basePath = `/w/${slug}`;

  const navItems = [
    {
      title: 'Dashboard',
      href: basePath,
      icon: LayoutDashboard,
      exact: true,
    },
    {
      title: 'UGC Feed',
      href: `${basePath}/ugc`,
      icon: Video,
    },
    {
      title: 'Rights Center',
      href: `${basePath}/rights`,
      icon: Shield,
    },
    {
      title: 'Repurpose Studio',
      href: `${basePath}/repurpose`,
      icon: Scissors,
    },
    {
      title: 'Products',
      href: `${basePath}/products`,
      icon: ShoppingBag,
    },
    {
      title: 'Shoppable Pages',
      href: `${basePath}/pages`,
      icon: FileVideo,
    },
    {
      title: 'Analytics',
      href: `${basePath}/analytics`,
      icon: BarChart3,
    },
  ];

  const settingsItems = [
    {
      title: 'Team',
      href: `${basePath}/settings/team`,
      icon: Users,
      minRole: 'ADMIN' as WorkspaceRole,
    },
    {
      title: 'Settings',
      href: `${basePath}/settings`,
      icon: Settings,
      exact: true,
    },
  ];

  const roleHierarchy: Record<WorkspaceRole, number> = {
    OWNER: 4,
    ADMIN: 3,
    MEMBER: 2,
    ANALYST: 1,
  };

  const hasAccess = (minRole?: WorkspaceRole) => {
    if (!minRole) return true;
    return roleHierarchy[role] >= roleHierarchy[minRole];
  };

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <nav className="hidden lg:flex flex-col w-64 border-r bg-muted/30 min-h-[calc(100vh-3.5rem)]">
      <div className="flex flex-col gap-1 p-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              isActive(item.href, item.exact)
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </Link>
        ))}
      </div>

      <div className="mt-auto border-t">
        <div className="flex flex-col gap-1 p-4">
          {settingsItems.map((item) => (
            hasAccess(item.minRole) && (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive(item.href, item.exact)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            )
          ))}
        </div>
      </div>
    </nav>
  );
}
