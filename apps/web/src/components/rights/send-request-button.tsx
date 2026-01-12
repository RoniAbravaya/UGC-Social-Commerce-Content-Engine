/**
 * Send Rights Request Button component
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

interface SendRequestButtonProps {
  slug: string;
  requestId: string;
  creatorHandle: string;
}

export function SendRequestButton({ slug, requestId, creatorHandle }: SendRequestButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(
    `Hi @${creatorHandle}! 👋\n\nWe love your content and would love to feature it on our brand page. Would you be open to granting us permission to use this video?\n\nWe'll give you full credit and can discuss compensation!\n\nThanks! 🙏`
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/workspaces/${slug}/rights/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'REQUESTED',
          notes: `Message sent: ${message.substring(0, 100)}...`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: 'Failed to update',
          description: data.error?.message || 'An error occurred',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Request sent',
        description: 'Status updated to Requested. Copy the message and send it to the creator.',
      });

      setIsOpen(false);
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

  async function copyMessage() {
    await navigator.clipboard.writeText(message);
    toast({
      title: 'Copied',
      description: 'Message copied to clipboard',
    });
  }

  if (!isOpen) {
    return (
      <Button size="sm" onClick={() => setIsOpen(true)}>Send Request</Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-lg">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-2">Send Rights Request</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Customize your message and copy it to send to @{creatorHandle}
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="message">Message Template</Label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="button" variant="secondary" onClick={copyMessage} disabled={isLoading}>
                Copy Message
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Mark as Requested'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
