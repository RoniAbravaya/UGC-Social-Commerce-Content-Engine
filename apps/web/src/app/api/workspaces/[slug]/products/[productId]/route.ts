/**
 * Product API - Get, update, delete a specific product
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ugc/database';
import { updateProductSchema } from '@ugc/shared';
import { getWorkspaceContext, hasPermission, addAuditLog } from '@/lib/workspace';

interface Params {
  params: { slug: string; productId: string };
}

// GET /api/workspaces/[slug]/products/[productId]
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const context = await getWorkspaceContext(params.slug);
    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Workspace not found' } },
        { status: 404 }
      );
    }

    const product = await prisma.product.findFirst({
      where: { id: params.productId, workspaceId: context.workspaceId },
      include: {
        contentProductMaps: {
          include: {
            ugcPost: { select: { id: true, creatorHandle: true, thumbnailUrl: true } },
            repurposedClip: { select: { id: true, thumbnailUrl: true } },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: { product } });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch product' } },
      { status: 500 }
    );
  }
}

// PATCH /api/workspaces/[slug]/products/[productId]
export async function PATCH(request: NextRequest, { params }: Params) {
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
    const validation = updateProductSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: validation.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const existing = await prisma.product.findFirst({
      where: { id: params.productId, workspaceId: context.workspaceId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } },
        { status: 404 }
      );
    }

    const product = await prisma.product.update({
      where: { id: params.productId },
      data: validation.data,
    });

    await addAuditLog({
      workspaceId: context.workspaceId,
      userId: context.userId,
      action: 'UPDATE',
      entityType: 'product',
      entityId: product.id,
      oldData: { title: existing.title },
      newData: { title: product.title },
    });

    return NextResponse.json({ success: true, data: { product } });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update product' } },
      { status: 500 }
    );
  }
}

// DELETE /api/workspaces/[slug]/products/[productId]
export async function DELETE(request: NextRequest, { params }: Params) {
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

    const existing = await prisma.product.findFirst({
      where: { id: params.productId, workspaceId: context.workspaceId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } },
        { status: 404 }
      );
    }

    await prisma.product.delete({ where: { id: params.productId } });

    await addAuditLog({
      workspaceId: context.workspaceId,
      userId: context.userId,
      action: 'DELETE',
      entityType: 'product',
      entityId: params.productId,
      oldData: { title: existing.title },
    });

    return NextResponse.json({ success: true, data: { message: 'Product deleted' } });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete product' } },
      { status: 500 }
    );
  }
}
