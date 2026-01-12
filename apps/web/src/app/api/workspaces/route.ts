/**
 * Workspaces API - List and create workspaces
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ugc/database';
import { createWorkspaceSchema } from '@ugc/shared';
import { getSession } from '@/lib/auth';
import { createWorkspace, getUserWorkspaces } from '@/lib/workspace';

// GET /api/workspaces - List user's workspaces
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const workspaces = await getUserWorkspaces(session.user.id);

    return NextResponse.json({
      success: true,
      data: { workspaces },
    });
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch workspaces' } },
      { status: 500 }
    );
  }
}

// POST /api/workspaces - Create a new workspace
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = createWorkspaceSchema.safeParse(body);

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

    const { name, slug } = validation.data;

    // Check workspace limit for free tier (e.g., max 1 workspace)
    const existingWorkspaces = await prisma.workspaceMember.count({
      where: { userId: session.user.id, role: 'OWNER' },
    });

    // For MVP, allow up to 3 workspaces per user
    if (existingWorkspaces >= 3) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'LIMIT_REACHED',
            message: 'You have reached the maximum number of workspaces',
          },
        },
        { status: 403 }
      );
    }

    const workspace = await createWorkspace(session.user.id, name, slug);

    return NextResponse.json(
      { success: true, data: { workspace } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating workspace:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create workspace' } },
      { status: 500 }
    );
  }
}
