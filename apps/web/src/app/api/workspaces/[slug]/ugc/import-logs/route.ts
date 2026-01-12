/**
 * Import Logs API - Get import history and detailed logs
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWorkspaceContext } from '@/lib/workspace';
import { getImportLogs } from '@/lib/import-logger';

interface Params {
  params: { slug: string };
}

// GET /api/workspaces/[slug]/ugc/import-logs - Get import logs
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const context = await getWorkspaceContext(params.slug);
    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Workspace not found' } },
        { status: 404 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const logs = await getImportLogs(context.workspaceId, limit);

    return NextResponse.json({
      success: true,
      data: { logs },
    });
  } catch (error) {
    console.error('Error fetching import logs:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch import logs' } },
      { status: 500 }
    );
  }
}
