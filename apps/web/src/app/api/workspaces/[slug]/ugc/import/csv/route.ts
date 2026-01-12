/**
 * CSV Import API for UGC Posts with detailed logging
 * Accepts CSV data with columns: post_url, platform, creator_handle, creator_name, caption, hashtags, posted_at
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ugc/database';
import { importUgcCsvRowSchema } from '@ugc/shared';
import { getWorkspaceContext, hasPermission, addAuditLog } from '@/lib/workspace';
import { ImportLogger } from '@/lib/import-logger';

interface Params {
  params: { slug: string };
}

// POST /api/workspaces/[slug]/ugc/import/csv
export async function POST(request: NextRequest, { params }: Params) {
  let logger: ImportLogger | null = null;

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

    // Initialize import logger
    logger = new ImportLogger({
      workspaceId: context.workspaceId,
      source: 'csv',
      totalItems: rows.length,
      metadata: { totalRows: rows.length },
    });

    await logger.start();
    await logger.info('VALIDATING', `Starting CSV import with ${rows.length} rows`);

    let imported = 0;
    let skipped = 0;
    let failed = 0;
    const errors: { row: number; error: string; postUrl?: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 1;
      const row = rows[i];

      try {
        // Validate row
        const validation = importUgcCsvRowSchema.safeParse(row);
        
        if (!validation.success) {
          failed++;
          const errorMsg = validation.error.errors[0]?.message || 'Invalid data';
          errors.push({ row: rowNum, error: errorMsg, postUrl: row.post_url });
          
          await logger.error('VALIDATING', `Row ${rowNum}: Validation failed - ${errorMsg}`, {
            row: rowNum,
            postUrl: row.post_url,
            errors: validation.error.flatten().fieldErrors,
          });
          continue;
        }

        const validatedRow = validation.data;

        // Check for duplicates
        const existing = await prisma.ugcPost.findFirst({
          where: { 
            workspaceId: context.workspaceId, 
            platform: validatedRow.platform,
            postUrl: validatedRow.post_url,
          },
        });

        if (existing) {
          skipped++;
          await logger.warning('CHECKING_DUPLICATE', `Row ${rowNum}: Duplicate post skipped`, {
            row: rowNum,
            postUrl: validatedRow.post_url,
            existingPostId: existing.id,
          });
          continue;
        }

        // Parse hashtags from comma-separated string
        const hashtags = validatedRow.hashtags
          ? validatedRow.hashtags.split(',').map(t => t.trim().toLowerCase().replace(/^#/, ''))
          : [];

        // Create post
        const post = await prisma.ugcPost.create({
          data: {
            workspaceId: context.workspaceId,
            platform: validatedRow.platform,
            postUrl: validatedRow.post_url,
            creatorHandle: validatedRow.creator_handle,
            creatorName: validatedRow.creator_name || null,
            caption: validatedRow.caption || null,
            hashtags,
            postedAt: validatedRow.posted_at ? new Date(validatedRow.posted_at) : null,
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
        
        await logger.success('CREATING_POST', `Row ${rowNum}: Successfully imported @${validatedRow.creator_handle}`, {
          row: rowNum,
          postId: post.id,
          creatorHandle: validatedRow.creator_handle,
          platform: validatedRow.platform,
        });

        // Update progress every 5 rows or at the end
        if (rowNum % 5 === 0 || rowNum === rows.length) {
          await logger.updateProgress(rowNum, imported, failed);
        }
      } catch (err) {
        failed++;
        const errorMsg = err instanceof Error ? err.message : 'Database error';
        errors.push({ row: rowNum, error: errorMsg, postUrl: row.post_url });
        
        await logger.error('CREATING_POST', `Row ${rowNum}: Database error`, {
          row: rowNum,
          postUrl: row.post_url,
          error: errorMsg,
        });
      }
    }

    // Final status
    const finalStatus = failed === rows.length ? 'FAILED' : (failed > 0 ? 'PARTIAL' : 'COMPLETED');
    await logger.updateProgress(rows.length, imported, failed);
    await logger.complete(finalStatus as any);

    await addAuditLog({
      workspaceId: context.workspaceId,
      userId: context.userId,
      action: 'CREATE',
      entityType: 'csv_import',
      entityId: logger.getLogId() || 'batch',
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
        importLogId: logger.getLogId(),
      },
    });
  } catch (error) {
    console.error('CSV import error:', error);
    
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    
    if (logger?.getLogId()) {
      await logger.error('FAILED', 'CSV import failed', { error: errorMsg });
      await logger.fail(errorMsg);
    }

    return NextResponse.json(
      { 
        success: false, 
        error: { code: 'INTERNAL_ERROR', message: 'Failed to import CSV' },
        importLogId: logger?.getLogId(),
      },
      { status: 500 }
    );
  }
}
