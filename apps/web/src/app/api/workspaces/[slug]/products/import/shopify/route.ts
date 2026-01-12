/**
 * Shopify Product Import API
 * Imports products from Shopify using Admin API
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ugc/database';
import { shopifyImportConfigSchema } from '@ugc/shared';
import { getWorkspaceContext, hasPermission, addAuditLog } from '@/lib/workspace';

interface Params {
  params: { slug: string };
}

interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  handle: string;
  images: { src: string }[];
  variants: {
    id: number;
    price: string;
    sku: string;
    inventory_quantity: number;
  }[];
}

// POST /api/workspaces/[slug]/products/import/shopify
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const context = await getWorkspaceContext(params.slug);
    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Workspace not found' } },
        { status: 404 }
      );
    }

    if (!hasPermission(context.role, 'write')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = shopifyImportConfigSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid Shopify configuration',
            details: validation.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { shopDomain, accessToken } = validation.data;

    // Fetch products from Shopify
    const shopifyUrl = `https://${shopDomain}/admin/api/2024-01/products.json?limit=250`;
    
    const response = await fetch(shopifyUrl, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Shopify API error:', errorText);
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'SHOPIFY_ERROR', 
            message: 'Failed to fetch products from Shopify. Check your credentials.' 
          } 
        },
        { status: 400 }
      );
    }

    const data = await response.json();
    const shopifyProducts: ShopifyProduct[] = data.products || [];

    // Import products
    let imported = 0;
    let updated = 0;
    let failed = 0;

    for (const sp of shopifyProducts) {
      try {
        const variant = sp.variants[0];
        const productData = {
          workspaceId: context.workspaceId,
          provider: 'SHOPIFY' as const,
          externalId: String(sp.id),
          title: sp.title,
          description: sp.body_html?.replace(/<[^>]*>/g, '') || null,
          price: variant?.price ? parseFloat(variant.price) : null,
          currency: 'USD',
          imageUrl: sp.images[0]?.src || null,
          url: `https://${shopDomain}/products/${sp.handle}`,
          sku: variant?.sku || null,
          inStock: (variant?.inventory_quantity || 0) > 0,
          syncedAt: new Date(),
        };

        const existing = await prisma.product.findFirst({
          where: {
            workspaceId: context.workspaceId,
            provider: 'SHOPIFY',
            externalId: String(sp.id),
          },
        });

        if (existing) {
          await prisma.product.update({
            where: { id: existing.id },
            data: productData,
          });
          updated++;
        } else {
          await prisma.product.create({ data: productData });
          imported++;
        }
      } catch (err) {
        console.error('Failed to import product:', sp.title, err);
        failed++;
      }
    }

    await addAuditLog({
      workspaceId: context.workspaceId,
      userId: context.userId,
      action: 'CREATE',
      entityType: 'shopify_import',
      entityId: 'batch',
      newData: { imported, updated, failed, total: shopifyProducts.length },
    });

    return NextResponse.json({
      success: true,
      data: {
        message: `Imported ${imported} new products, updated ${updated} existing`,
        imported,
        updated,
        failed,
        total: shopifyProducts.length,
      },
    });
  } catch (error) {
    console.error('Shopify import error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to import from Shopify' } },
      { status: 500 }
    );
  }
}
