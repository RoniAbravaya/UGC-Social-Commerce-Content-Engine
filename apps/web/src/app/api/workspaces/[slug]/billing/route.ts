/**
 * Billing API - Manage workspace subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getWorkspaceContext, hasPermission } from '@/lib/workspace';
import { 
  stripe, 
  PLANS, 
  createCheckoutSession, 
  createPortalSession, 
  checkPlanLimits 
} from '@/lib/stripe';
import { prisma, WorkspacePlan } from '@ugc/database';

interface Params {
  params: { slug: string };
}

// GET /api/workspaces/[slug]/billing - Get billing info
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const context = await getWorkspaceContext(params.slug);
    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Workspace not found' } },
        { status: 404 }
      );
    }

    if (!hasPermission(context.role, 'owner')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only owners can view billing' } },
        { status: 403 }
      );
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: context.workspaceId },
      select: {
        plan: true,
        subscriptionId: true,
        subscriptionStatus: true,
        stripeCustomerId: true,
      },
    });

    const { usage } = await checkPlanLimits(context.workspaceId);

    return NextResponse.json({
      success: true,
      data: {
        plan: workspace?.plan || 'FREE',
        planDetails: PLANS[workspace?.plan || 'FREE'],
        subscriptionStatus: workspace?.subscriptionStatus || null,
        hasStripeCustomer: !!workspace?.stripeCustomerId,
        usage,
        plans: Object.entries(PLANS).map(([key, value]) => ({
          id: key,
          ...value,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching billing:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch billing info' } },
      { status: 500 }
    );
  }
}

const createCheckoutSchema = z.object({
  plan: z.enum(['STARTER', 'GROWTH', 'SCALE']),
});

// POST /api/workspaces/[slug]/billing/checkout - Create checkout session
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

    const body = await request.json();
    const validation = createCheckoutSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid plan' } },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { id: context.userId },
      select: { email: true },
    });

    if (!user?.email) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_EMAIL', message: 'User email required' } },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/w/${params.slug}/settings/billing?success=true`;
    const cancelUrl = `${baseUrl}/w/${params.slug}/settings/billing?cancelled=true`;

    const checkoutUrl = await createCheckoutSession(
      context.workspaceId,
      validation.data.plan as WorkspacePlan,
      user.email,
      successUrl,
      cancelUrl
    );

    return NextResponse.json({
      success: true,
      data: { checkoutUrl },
    });
  } catch (error) {
    console.error('Error creating checkout:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create checkout' } },
      { status: 500 }
    );
  }
}
