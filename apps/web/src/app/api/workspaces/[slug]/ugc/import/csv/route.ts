/**
 * CSV Import API for UGC Posts
 * Accepts CSV data with columns: post_url, platform, creator_handle, creator_name, caption, hashtags, posted_at
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ugc/database';
import { importUgcCsvRowSchema } from '@ugc/shared';
import { getWorkspaceContext, hasPermission, addAuditLog } from '@/lib/workspace';

interface Params {
  params: { slug: string };
}

// POST /api/workspaces/[slug]/ugc/import/csv
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
    const { rows } = body as { rows: Record<string, string>[] };

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'No rows provided' } },
        { status: 400 }
      );
    }

    let imported = 0;
    let skipped = 0;
    let failed = 0;
    const errors: { row: number; error: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      try {
        const validation = importUgcCsvRowSchema.safeParse(rows[i]);
        
        if (!validation.success) {
          failed++;
          errors.push({ row: i + 1, error: validation.error.errors[0]?.message || 'Invalid data' });
          continue;
        }

        const row = validation.data;

        // Check for duplicates
        const existing = await prisma.ugcPost.findFirst({
          where: { 
            workspaceId: context.workspaceId, 
            platform: row.platform,
            postUrl: row.post_url,
          },
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Parse hashtags from comma-separated string
        const hashtags = row.hashtags
          ? row.hashtags.split(',').map(t => t.trim().toLowerCase().replace(/^#/, ''))
          : [];

        const post = await prisma.ugcPost.create({
          data: {
            workspaceId: context.workspaceId,
            platform: row.platform,
            postUrl: row.post_url,
            creatorHandle: row.creator_handle,
            creatorName: row.creator_name || null,
            caption: row.caption || null,
            hashtags,
            postedAt: row.posted_at ? new Date(row.posted_at) : null,
            importSource: 'csv',
          },
        });

        // Auto-create pending rights request
        await prisma.rightsRequest.create({
          data: {
            workspaceId: context.workspaceId,
            ugcPostId: post.id,
            status: 'PENDING',
          },
        });

        imported++;
      } catch (err) {
        failed++;
        errors.push({ row: i + 1, error: 'Database error' });
      }
    }

    await addAuditLog({
      workspaceId: context.workspaceId,
      userId: context.userId,
      action: 'CREATE',
      entityType: 'csv_import',
      entityId: 'batch',
      newData: { imported, skipped, failed, total: rows.length },
    });

    return NextResponse.json({
      success: true,
      data: {
        message: `Imported ${imported} posts, skipped ${skipped} duplicates, ${failed} failed`,
        imported,
        skipped,
        failed,
        total: rows.length,
        errors: errors.slice(0, 10), // Return first 10 errors
      },
    });
  } catch (error) {
    console.error('CSV import error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to import CSV' } },
      { status: 500 }
    );
  }
}
