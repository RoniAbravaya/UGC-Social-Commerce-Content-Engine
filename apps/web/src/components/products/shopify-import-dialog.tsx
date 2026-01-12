/**
 * Shopify Import Dialog component
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

interface ShopifyImportDialogProps {
  slug: string;
}

export function ShopifyImportDialog({ slug }: ShopifyImportDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    shopDomain: '',
    accessToken: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/workspaces/${slug}/products/import/shopify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopDomain: formData.shopDomain,
          accessToken: formData.accessToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: 'Failed to import',
          description: data.error?.message || 'An error occurred',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Products imported',
        description: `Imported ${data.data.imported} products, ${data.data.updated} updated`,
      });

      setFormData({ shopDomain: '', accessToken: '' });
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

  if (!isOpen) {
    return (
      <Button variant="outline" onClick={() => setIsOpen(true)}>Connect Shopify</Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-2">Import from Shopify</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Enter your Shopify store details to import products
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shopDomain">Shop Domain *</Label>
              <Input
                id="shopDomain"
                value={formData.shopDomain}
                onChange={(e) => setFormData({ ...formData, shopDomain: e.target.value })}
                placeholder="mystore.myshopify.com"
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Your Shopify store domain (e.g., mystore.myshopify.com)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accessToken">Admin API Access Token *</Label>
              <Input
                id="accessToken"
                type="password"
                value={formData.accessToken}
                onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                placeholder="shpat_..."
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Create a private app in Shopify Admin → Settings → Apps → Develop apps
              </p>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Importing...' : 'Import Products'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
