/**
 * Invite member form component
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

interface InviteMemberFormProps {
  slug: string;
}

export function InviteMemberForm({ slug }: InviteMemberFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'MEMBER' | 'ANALYST'>('MEMBER');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/workspaces/${slug}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: 'Failed to send invitation',
          description: data.error?.message || 'An error occurred',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Invitation sent',
        description: `An invitation has been sent to ${email}`,
      });

      setEmail('');
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
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1 space-y-2">
        <Label htmlFor="email" className="sr-only">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="colleague@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role" className="sr-only">Role</Label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value as typeof role)}
          disabled={isLoading}
          className="flex h-10 w-full sm:w-[140px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="MEMBER">Member</option>
          <option value="ADMIN">Admin</option>
          <option value="ANALYST">Analyst</option>
        </select>
      </div>
      <Button type="submit" disabled={isLoading || !email}>
        {isLoading ? 'Sending...' : 'Send Invite'}
      </Button>
    </form>
  );
}
