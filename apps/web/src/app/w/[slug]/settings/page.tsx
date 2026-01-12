/**
 * Workspace settings page
 */

import { prisma } from '@ugc/database';
import { getWorkspaceContext, hasPermission } from '@/lib/workspace';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkspaceSettingsForm } from '@/components/workspace/workspace-settings-form';
import { DeleteWorkspaceDialog } from '@/components/settings/delete-workspace-dialog';

interface SettingsPageProps {
  params: { slug: string };
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const context = await getWorkspaceContext(params.slug);
  
  if (!context) {
    return null;
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: context.workspaceId },
  });

  if (!workspace) {
    return null;
  }

  const canEdit = hasPermission(context.role, 'admin');

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your workspace settings and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>
            Basic workspace information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WorkspaceSettingsForm 
            workspace={workspace} 
            canEdit={canEdit} 
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>
            Your current plan and billing information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium capitalize">{workspace.plan.toLowerCase()} Plan</p>
              <p className="text-sm text-muted-foreground">
                {workspace.plan === 'FREE' 
                  ? 'Limited features and usage' 
                  : 'Full access to all features'}
              </p>
            </div>
            {hasPermission(context.role, 'owner') && (
              <a
                href={`/w/${params.slug}/settings/billing`}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4"
              >
                Manage Billing
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      {hasPermission(context.role, 'owner') && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions for your workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Delete Workspace</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete this workspace and all its data
                </p>
              </div>
              <DeleteWorkspaceDialog slug={params.slug} workspaceName={workspace.name} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
