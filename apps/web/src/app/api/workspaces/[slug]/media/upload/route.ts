/**
 * Media Upload API - Get presigned URLs for direct uploads
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getWorkspaceContext, hasPermission } from '@/lib/workspace';
import { getUploadUrl, generateMediaKey } from '@/lib/s3';

interface Params {
  params: { slug: string };
}

const uploadRequestSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().regex(/^(video|image)\//),
  type: z.enum(['video', 'image']),
});

// POST /api/workspaces/[slug]/media/upload - Get presigned upload URL
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
    const validation = uploadRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: validation.error.flatten().fieldErrors },
        },
        { status: 400 }
      );
    }

    const { filename, contentType, type } = validation.data;

    const storageKey = generateMediaKey(context.workspaceId, type, filename);
    const uploadUrl = await getUploadUrl(storageKey, contentType, 3600);

    return NextResponse.json({
      success: true,
      data: {
        uploadUrl,
        storageKey,
        expiresIn: 3600,
      },
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to generate upload URL' } },
      { status: 500 }
    );
  }
}
