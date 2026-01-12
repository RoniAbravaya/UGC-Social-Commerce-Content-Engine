/**
 * Invitation acceptance page
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface InvitationData {
  email: string;
  role: string;
  workspace: {
    name: string;
    slug: string;
  };
  expiresAt: string;
}

export default function InvitePage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    async function fetchInvitation() {
      try {
        const response = await fetch(`/api/invite/${params.token}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error?.message || 'Invalid invitation');
          return;
        }

        setInvitation(data.data.invitation);
      } catch (err) {
        setError('Failed to load invitation');
      } finally {
        setIsLoading(false);
      }
    }

    fetchInvitation();
  }, [params.token]);

  async function handleAccept() {
    setIsAccepting(true);
    try {
      const response = await fetch(`/api/invite/${params.token}`, {
        method: 'POST',
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message || 'Failed to accept invitation');
        return;
      }

      router.push(`/w/${data.data.workspaceSlug}`);
    } catch (err) {
      setError('Failed to accept invitation');
    } finally {
      setIsAccepting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading invitation...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-destructive">Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/')}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  const roleLabels: Record<string, string> = {
    ADMIN: 'Admin',
    MEMBER: 'Member',
    ANALYST: 'Analyst',
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">
                {invitation.workspace.name.charAt(0)}
              </span>
            </div>
          </div>
          <CardTitle>You&apos;re Invited!</CardTitle>
          <CardDescription>
            Join <strong>{invitation.workspace.name}</strong> as a{' '}
            <strong>{roleLabels[invitation.role] || invitation.role}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' ? (
            <div className="text-center">Checking authentication...</div>
          ) : status === 'unauthenticated' ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Sign in or create an account to accept this invitation
              </p>
              <div className="flex flex-col gap-2">
                <Button onClick={() => signIn(undefined, { callbackUrl: `/invite/${params.token}` })}>
                  Sign In
                </Button>
                <Button variant="outline" onClick={() => router.push(`/auth/register?redirect=/invite/${params.token}`)}>
                  Create Account
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Signed in as <strong>{session?.user?.email}</strong>
              </p>
              <Button 
                className="w-full" 
                onClick={handleAccept}
                disabled={isAccepting}
              >
                {isAccepting ? 'Joining...' : 'Accept Invitation'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
