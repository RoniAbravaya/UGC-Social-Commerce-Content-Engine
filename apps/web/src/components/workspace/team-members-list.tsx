/**
 * Team members list component
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, UserMinus, Shield, Clock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import type { WorkspaceRole, WorkspaceMember, User, WorkspaceInvitation } from '@ugc/database';

interface MemberWithUser extends WorkspaceMember {
  user: Pick<User, 'id' | 'email' | 'name' | 'image'>;
}

interface TeamMembersListProps {
  members: MemberWithUser[];
  invitations: WorkspaceInvitation[];
  currentUserId: string;
  currentUserRole: WorkspaceRole;
  slug: string;
}

const roleLabels: Record<WorkspaceRole, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MEMBER: 'Member',
  ANALYST: 'Analyst',
};

const roleBadgeColors: Record<WorkspaceRole, string> = {
  OWNER: 'bg-primary/10 text-primary',
  ADMIN: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  MEMBER: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  ANALYST: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
};

export function TeamMembersList({ 
  members, 
  invitations,
  currentUserId, 
  currentUserRole,
  slug 
}: TeamMembersListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const isOwner = currentUserRole === 'OWNER';
  const isAdmin = currentUserRole === 'ADMIN' || isOwner;

  async function handleRemoveMember(memberId: string) {
    setLoadingId(memberId);

    try {
      const response = await fetch(`/api/workspaces/${slug}/members/${memberId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: 'Failed to remove member',
          description: data.error?.message || 'An error occurred',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Member removed',
        description: 'The member has been removed from the workspace',
      });

      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoadingId(null);
    }
  }

  async function handleUpdateRole(memberId: string, role: WorkspaceRole) {
    setLoadingId(memberId);

    try {
      const response = await fetch(`/api/workspaces/${slug}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: 'Failed to update role',
          description: data.error?.message || 'An error occurred',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Role updated',
        description: `Member is now a ${roleLabels[role]}`,
      });

      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Active Members */}
      {members.map((member) => {
        const isCurrentUser = member.userId === currentUserId;
        const canManage = isAdmin && !isCurrentUser && member.role !== 'OWNER';

        return (
          <div
            key={member.id}
            className="flex items-center justify-between p-4 rounded-lg border"
          >
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src={member.user.image || undefined} />
                <AvatarFallback>
                  {member.user.name?.charAt(0).toUpperCase() || member.user.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {member.user.name || member.user.email}
                  {isCurrentUser && <span className="text-muted-foreground ml-2">(you)</span>}
                </p>
                <p className="text-sm text-muted-foreground">{member.user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${roleBadgeColors[member.role]}`}>
                {roleLabels[member.role]}
              </span>
              {canManage && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={loadingId === member.id}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleUpdateRole(member.id, 'ADMIN')}>
                      <Shield className="mr-2 h-4 w-4" />
                      Make Admin
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleUpdateRole(member.id, 'MEMBER')}>
                      <Shield className="mr-2 h-4 w-4" />
                      Make Member
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleUpdateRole(member.id, 'ANALYST')}>
                      <Shield className="mr-2 h-4 w-4" />
                      Make Analyst
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <UserMinus className="mr-2 h-4 w-4" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        );
      })}

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <>
          <div className="pt-4 border-t">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Pending Invitations</h3>
          </div>
          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="flex items-center justify-between p-4 rounded-lg border border-dashed"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{invitation.email}</p>
                  <p className="text-sm text-muted-foreground">
                    Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${roleBadgeColors[invitation.role]}`}>
                {roleLabels[invitation.role]}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
