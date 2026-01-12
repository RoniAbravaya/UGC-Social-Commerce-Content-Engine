/**
 * Workspace Members API - Manage workspace team members
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ugc/database';
import { inviteMemberSchema } from '@ugc/shared';
import { generateToken } from '@ugc/shared';
import { getWorkspaceContext, hasPermission, addAuditLog } from '@/lib/workspace';

interface Params {
  params: { slug: string };
}

// GET /api/workspaces/[slug]/members - List workspace members
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const context = await getWorkspaceContext(params.slug);
    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Workspace not found or access denied' } },
        { status: 404 }
      );
    }

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: context.workspaceId },
      include: {
        user: {
          select: { id: true, email: true, name: true, image: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const invitations = await prisma.workspaceInvitation.findMany({
      where: { 
        workspaceId: context.workspaceId,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: { members, invitations },
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch members' } },
      { status: 500 }
    );
  }
}

// POST /api/workspaces/[slug]/members - Invite a new member
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const context = await getWorkspaceContext(params.slug);
    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Workspace not found or access denied' } },
        { status: 404 }
      );
    }

    // Only owners and admins can invite members
    if (!hasPermission(context.role, 'admin')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = inviteMemberSchema.safeParse(body);

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

    const { email, role } = validation.data;
    const normalizedEmail = email.toLowerCase();

    // Check if user is already a member
    const existingMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: context.workspaceId,
        user: { email: normalizedEmail },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_MEMBER', message: 'User is already a member' } },
        { status: 409 }
      );
    }

    // Check for existing pending invitation
    const existingInvitation = await prisma.workspaceInvitation.findUnique({
      where: {
        email_workspaceId: {
          email: normalizedEmail,
          workspaceId: context.workspaceId,
        },
      },
    });

    if (existingInvitation && !existingInvitation.acceptedAt && existingInvitation.expiresAt > new Date()) {
      return NextResponse.json(
        { success: false, error: { code: 'INVITATION_EXISTS', message: 'An invitation is already pending' } },
        { status: 409 }
      );
    }

    // Create or update invitation
    const token = generateToken(32);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await prisma.workspaceInvitation.upsert({
      where: {
        email_workspaceId: {
          email: normalizedEmail,
          workspaceId: context.workspaceId,
        },
      },
      create: {
        email: normalizedEmail,
        workspaceId: context.workspaceId,
        role,
        token,
        expiresAt,
      },
      update: {
        role,
        token,
        expiresAt,
        acceptedAt: null,
      },
    });

    // Add audit log
    await addAuditLog({
      workspaceId: context.workspaceId,
      userId: context.userId,
      action: 'CREATE',
      entityType: 'invitation',
      entityId: invitation.id,
      newData: { email: normalizedEmail, role },
    });

    // TODO: Send invitation email
    // For MVP, return the invitation link
    const inviteUrl = `${process.env.NEXTAUTH_URL}/invite/${token}`;

    return NextResponse.json({
      success: true,
      data: { invitation, inviteUrl },
    }, { status: 201 });
  } catch (error) {
    console.error('Error inviting member:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to invite member' } },
      { status: 500 }
    );
  }
}
