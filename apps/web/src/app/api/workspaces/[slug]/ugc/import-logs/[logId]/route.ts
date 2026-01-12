/**
 * Single Import Log API - Get detailed log entries
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWorkspaceContext } from '@/lib/workspace';
import { getImportLog } from '@/lib/import-logger';

interface Params {
  params: { slug: string; logId: string };
}

// GET /api/workspaces/[slug]/ugc/import-logs/[logId] - Get specific import log
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const context = await getWorkspaceContext(params.slug);
    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Workspace not found' } },
        { status: 404 }
      );
    }

    const log = await getImportLog(params.logId, context.workspaceId);

    if (!log) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Import log not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { log },
    });
  } catch (error) {
    console.error('Error fetching import log:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch import log' } },
      { status: 500 }
    );
  }
}
