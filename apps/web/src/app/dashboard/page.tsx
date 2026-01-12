/**
 * Dashboard page - redirects to first workspace or shows workspace selector
 */

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { getUserWorkspaces } from '@/lib/workspace';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function DashboardPage() {
  const session = await getSession();
  
  if (!session?.user) {
    redirect('/auth/login');
  }

  const workspaces = await getUserWorkspaces(session.user.id);

  // If user has workspaces, redirect to first one
  if (workspaces.length > 0) {
    redirect(`/w/${workspaces[0].slug}`);
  }

  // No workspaces - show onboarding
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">U</span>
            </div>
          </div>
          <CardTitle>Welcome to UGC Commerce</CardTitle>
          <CardDescription>
            Create your first workspace to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/onboarding">
            <Button className="w-full">Create Workspace</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
