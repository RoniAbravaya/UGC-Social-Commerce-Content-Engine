/**
 * Billing Portal API - Redirect to Stripe customer portal
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWorkspaceContext, hasPermission } from '@/lib/workspace';
import { stripe, createPortalSession } from '@/lib/stripe';

interface Params {
  params: { slug: string };
}

// POST /api/workspaces/[slug]/billing/portal - Create portal session
export async function POST(request: NextRequest, { params }: Params) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_CONFIGURED', message: 'Billing not configured' } },
        { status: 503 }
      );
    }

    const context = await getWorkspaceContext(params.slug);
    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Workspace not found' } },
        { status: 404 }
      );
    }

    if (!hasPermission(context.role, 'owner')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only owners can manage billing' } },
        { status: 403 }
      );
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const returnUrl = `${baseUrl}/w/${params.slug}/settings/billing`;

    const portalUrl = await createPortalSession(context.workspaceId, returnUrl);

    return NextResponse.json({
      success: true,
      data: { portalUrl },
    });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to open billing portal' } },
      { status: 500 }
    );
  }
}
