/**
 * Onboarding page - Create first workspace
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [workspaceName, setWorkspaceName] = useState('');

  async function handleCreateWorkspace() {
    if (!workspaceName.trim()) {
      toast({
        title: 'Workspace name required',
        description: 'Please enter a name for your workspace',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: workspaceName }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: 'Failed to create workspace',
          description: data.error?.message || 'An error occurred',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Workspace created!',
        description: 'Setting up your workspace...',
      });

      // Redirect to the new workspace dashboard
      router.push(`/w/${data.data.workspace.slug}`);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">U</span>
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome to UGC Commerce Engine</CardTitle>
          <CardDescription>Let&apos;s set up your workspace in a few simple steps</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-3 h-3 rounded-full transition-colors ${
                  s === step ? 'bg-primary' : s < step ? 'bg-primary/50' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="workspaceName">Workspace Name</Label>
                <Input
                  id="workspaceName"
                  type="text"
                  placeholder="e.g., My Brand"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-sm text-muted-foreground">
                  This is usually your brand or company name
                </p>
              </div>
              <Button 
                className="w-full" 
                onClick={() => setStep(2)}
                disabled={!workspaceName.trim()}
              >
                Continue
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="font-semibold text-lg mb-2">Connect Your Store</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Import products from Shopify to tag in your UGC content
                </p>
              </div>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start gap-3" disabled>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.337 3.415c-.291-.292-.77-.292-1.061 0l-.354.354a.75.75 0 0 0 0 1.06l4.249 4.25H8.25a.75.75 0 0 0 0 1.5h9.92l-4.249 4.25a.75.75 0 0 0 0 1.06l.354.354c.291.292.77.292 1.061 0l6.01-6.01a.75.75 0 0 0 0-1.06l-6.01-6.01z" />
                  </svg>
                  Connect Shopify
                  <span className="ml-auto text-xs text-muted-foreground">Coming soon</span>
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => setStep(3)}
                >
                  Skip for now
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="font-semibold text-lg mb-2">You&apos;re all set!</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Your workspace <strong>&quot;{workspaceName}&quot;</strong> is ready.
                  Start by importing your first UGC content.
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold">1</span>
                  </div>
                  <div className="text-sm">Import UGC from TikTok or Instagram</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold">2</span>
                  </div>
                  <div className="text-sm">Request content usage rights</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold">3</span>
                  </div>
                  <div className="text-sm">Create shoppable clips and pages</div>
                </div>
              </div>
              <Button 
                className="w-full" 
                onClick={handleCreateWorkspace}
                disabled={isLoading}
              >
                {isLoading ? 'Creating workspace...' : 'Go to Dashboard'}
              </Button>
            </div>
          )}

          {step > 1 && step < 3 && (
            <Button 
              variant="ghost" 
              className="w-full mt-4"
              onClick={() => setStep(step - 1)}
            >
              Back
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
