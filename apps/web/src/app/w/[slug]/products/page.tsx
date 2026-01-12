/**
 * Products page - manage shoppable products
 */

import { prisma } from '@ugc/database';
import { getWorkspaceContext } from '@/lib/workspace';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@ugc/shared';
import { AddProductDialog } from '@/components/products/add-product-dialog';
import { ShopifyImportDialog } from '@/components/products/shopify-import-dialog';

interface ProductsPageProps {
  params: { slug: string };
}

export default async function ProductsPage({ params }: ProductsPageProps) {
  const context = await getWorkspaceContext(params.slug);
  
  if (!context) {
    return null;
  }

  const products = await prisma.product.findMany({
    where: { workspaceId: context.workspaceId },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage products for tagging in your UGC content
          </p>
        </div>
        <div className="flex gap-2">
          <ShopifyImportDialog slug={params.slug} />
          <AddProductDialog slug={params.slug} />
        </div>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground mb-4">No products yet</p>
            <div className="flex gap-2">
              <ShopifyImportDialog slug={params.slug} />
              <AddProductDialog slug={params.slug} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="aspect-square bg-muted relative">
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={product.imageUrl} 
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-muted-foreground">No image</span>
                  </div>
                )}
                <span className={`absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-medium ${
                  product.inStock 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {product.inStock ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium line-clamp-1">{product.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {product.price 
                    ? formatCurrency(Number(product.price), product.currency)
                    : 'Price not set'
                  }
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    product.provider === 'SHOPIFY'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {product.provider}
                  </span>
                  {product.sku && (
                    <span className="text-xs text-muted-foreground">
                      SKU: {product.sku}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
