/**
 * Rights Request Templates API
 */

import { NextRequest, NextResponse } from 'next/server';
import { rightsRequestTemplates } from '@ugc/shared';
import { getWorkspaceContext } from '@/lib/workspace';

interface Params {
  params: { slug: string };
}

// GET /api/workspaces/[slug]/rights/templates - Get request templates
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const context = await getWorkspaceContext(params.slug);
    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Workspace not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        templates: [
          {
            id: 'dm',
            name: 'Direct Message',
            description: 'Casual template for DMs on social platforms',
            content: rightsRequestTemplates.dm,
          },
          {
            id: 'email',
            name: 'Email',
            description: 'Professional email template',
            content: rightsRequestTemplates.email,
          },
          {
            id: 'comment',
            name: 'Comment',
            description: 'Short template for post comments',
            content: rightsRequestTemplates.comment,
          },
        ],
        variables: [
          { key: '{creator_name}', description: 'Creator name or handle' },
          { key: '{hashtag/product}', description: 'Relevant hashtag or product' },
          { key: '{brand_name}', description: 'Your brand name' },
        ],
      },
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch templates' } },
      { status: 500 }
    );
  }
}
