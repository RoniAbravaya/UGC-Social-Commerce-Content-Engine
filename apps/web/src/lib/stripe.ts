/**
 * Stripe client and billing utilities
 */

import Stripe from 'stripe';
import { prisma, WorkspacePlan } from '@ugc/database';

// Initialize Stripe client
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' })
  : null;

// Plan configuration
export const PLANS: Record<WorkspacePlan, {
  name: string;
  priceId: string | null;
  limits: {
    ugcPosts: number;
    clips: number;
    pages: number;
    members: number;
  };
}> = {
  FREE: {
    name: 'Free',
    priceId: null,
    limits: {
      ugcPosts: 50,
      clips: 10,
      pages: 1,
      members: 2,
    },
  },
  STARTER: {
    name: 'Starter',
    priceId: process.env.STRIPE_PRICE_STARTER || null,
    limits: {
      ugcPosts: 500,
      clips: 100,
      pages: 5,
      members: 5,
    },
  },
  GROWTH: {
    name: 'Growth',
    priceId: process.env.STRIPE_PRICE_GROWTH || null,
    limits: {
      ugcPosts: 2000,
      clips: 500,
      pages: 20,
      members: 15,
    },
  },
  SCALE: {
    name: 'Scale',
    priceId: process.env.STRIPE_PRICE_SCALE || null,
    limits: {
      ugcPosts: 10000,
      clips: 2000,
      pages: 100,
      members: 50,
    },
  },
};

/**
 * Get or create a Stripe customer for a workspace
 */
export async function getOrCreateCustomer(workspaceId: string, email: string): Promise<string | null> {
  if (!stripe) {
    console.warn('Stripe not configured');
    return null;
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) {
    throw new Error('Workspace not found');
  }

  if (workspace.stripeCustomerId) {
    return workspace.stripeCustomerId;
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      workspaceId,
      workspaceName: workspace.name,
    },
  });

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

/**
 * Create a checkout session for subscription
 */
export async function createCheckoutSession(
  workspaceId: string,
  plan: WorkspacePlan,
  customerEmail: string,
  successUrl: string,
  cancelUrl: string
): Promise<string | null> {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  const priceId = PLANS[plan].priceId;
  if (!priceId) {
    throw new Error('Invalid plan or price not configured');
  }

  const customerId = await getOrCreateCustomer(workspaceId, customerEmail);
  if (!customerId) {
    throw new Error('Failed to get customer');
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      workspaceId,
      plan,
    },
  });

  return session.url;
}

/**
 * Create a billing portal session
 */
export async function createPortalSession(
  workspaceId: string,
  returnUrl: string
): Promise<string | null> {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace?.stripeCustomerId) {
    throw new Error('No billing account found');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: workspace.stripeCustomerId,
    return_url: returnUrl,
  });

  return session.url;
}

/**
 * Handle subscription status changes from webhook
 */
export async function handleSubscriptionChange(
  subscription: Stripe.Subscription
): Promise<void> {
  const workspaceId = subscription.metadata.workspaceId;
  if (!workspaceId) {
    console.error('No workspaceId in subscription metadata');
    return;
  }

  const status = subscription.status;
  const plan = subscription.metadata.plan as WorkspacePlan || 'STARTER';

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      subscriptionId: subscription.id,
      subscriptionStatus: status,
      plan: status === 'active' ? plan : 'FREE',
    },
  });
}

/**
 * Check if workspace has exceeded plan limits
 */
export async function checkPlanLimits(workspaceId: string): Promise<{
  withinLimits: boolean;
  usage: Record<string, { current: number; limit: number }>;
}> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      _count: {
        select: {
          ugcPosts: true,
          repurposedClips: true,
          shoppablePages: true,
          members: true,
        },
      },
    },
  });

  if (!workspace) {
    throw new Error('Workspace not found');
  }

  const limits = PLANS[workspace.plan].limits;

  const usage = {
    ugcPosts: { current: workspace._count.ugcPosts, limit: limits.ugcPosts },
    clips: { current: workspace._count.repurposedClips, limit: limits.clips },
    pages: { current: workspace._count.shoppablePages, limit: limits.pages },
    members: { current: workspace._count.members, limit: limits.members },
  };

  const withinLimits = Object.values(usage).every(u => u.current < u.limit);

  return { withinLimits, usage };
}
