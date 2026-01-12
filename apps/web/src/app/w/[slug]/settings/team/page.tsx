/**
 * Team management page
 */

import { prisma } from '@ugc/database';
import { getWorkspaceContext, hasPermission } from '@/lib/workspace';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TeamMembersList } from '@/components/workspace/team-members-list';
import { InviteMemberForm } from '@/components/workspace/invite-member-form';

interface TeamPageProps {
  params: { slug: string };
}

export default async function TeamPage({ params }: TeamPageProps) {
  const context = await getWorkspaceContext(params.slug);
  
  if (!context) {
    return null;
  }

  // Only admins and owners can access team page
  if (!hasPermission(context.role, 'admin')) {
    redirect(`/w/${params.slug}`);
  }

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: context.workspaceId },
    include: {
      user: {
        select: { id: true, email: true, name: true, image: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const invitations = await prisma.workspaceInvitation.findMany({
    where: { 
      workspaceId: context.workspaceId,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team</h1>
        <p className="text-muted-foreground">
          Manage your workspace members and their roles
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invite Team Member</CardTitle>
          <CardDescription>
            Send an invitation to add someone to your workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InviteMemberForm slug={params.slug} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            {members.length} member{members.length !== 1 ? 's' : ''} in this workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TeamMembersList 
            members={members} 
            invitations={invitations}
            currentUserId={context.userId}
            currentUserRole={context.role}
            slug={params.slug}
          />
        </CardContent>
      </Card>
    </div>
  );
}
