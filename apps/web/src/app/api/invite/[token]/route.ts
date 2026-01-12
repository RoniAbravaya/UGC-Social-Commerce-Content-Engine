/**
 * Accept Invitation API
 * Allows users to accept workspace invitations
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ugc/database';
import { getSession } from '@/lib/auth';

interface Params {
  params: { token: string };
}

// GET /api/invite/[token] - Get invitation details
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { token: params.token },
      include: {
        workspace: {
          select: { id: true, name: true, slug: true, logoUrl: true },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Invitation not found' } },
        { status: 404 }
      );
    }

    if (invitation.acceptedAt) {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_ACCEPTED', message: 'Invitation already accepted' } },
        { status: 400 }
      );
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: { code: 'EXPIRED', message: 'Invitation has expired' } },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          workspace: invitation.workspace,
          expiresAt: invitation.expiresAt,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching invitation:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch invitation' } },
      { status: 500 }
    );
  }
}

// POST /api/invite/[token] - Accept invitation
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Please sign in to accept invitation' } },
        { status: 401 }
      );
    }

    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { token: params.token },
      include: {
        workspace: { select: { slug: true } },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Invitation not found' } },
        { status: 404 }
      );
    }

    if (invitation.acceptedAt) {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_ACCEPTED', message: 'Invitation already accepted' } },
        { status: 400 }
      );
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: { code: 'EXPIRED', message: 'Invitation has expired' } },
        { status: 400 }
      );
    }

    // Check if user email matches (optional - can be made strict)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });

    // Check if already a member
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: invitation.workspaceId,
        },
      },
    });

    if (existingMember) {
      // Mark invitation as accepted and return success
      await prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });

      return NextResponse.json({
        success: true,
        data: {
          message: 'Already a member of this workspace',
          workspaceSlug: invitation.workspace.slug,
        },
      });
    }

    // Create membership and mark invitation as accepted
    await prisma.$transaction([
      prisma.workspaceMember.create({
        data: {
          userId: session.user.id,
          workspaceId: invitation.workspaceId,
          role: invitation.role,
        },
      }),
      prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Successfully joined workspace',
        workspaceSlug: invitation.workspace.slug,
      },
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to accept invitation' } },
      { status: 500 }
    );
  }
}
