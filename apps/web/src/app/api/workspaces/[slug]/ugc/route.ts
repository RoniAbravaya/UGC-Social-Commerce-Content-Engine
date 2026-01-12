/**
 * UGC Posts API - List and import UGC content with detailed logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ugc/database';
import { ugcPostFiltersSchema, importUgcManualSchema } from '@ugc/shared';
import { getWorkspaceContext, hasPermission, addAuditLog } from '@/lib/workspace';
import { ImportLogger } from '@/lib/import-logger';

interface Params {
  params: { slug: string };
}

// GET /api/workspaces/[slug]/ugc - List UGC posts
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
    const filters = ugcPostFiltersSchema.parse({
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
      platform: searchParams.get('platform'),
      rightsStatus: searchParams.get('rightsStatus'),
      creatorHandle: searchParams.get('creatorHandle'),
      hashtag: searchParams.get('hashtag'),
      search: searchParams.get('search'),
      from: searchParams.get('from'),
      to: searchParams.get('to'),
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    });

    const where: Record<string, unknown> = {
      workspaceId: context.workspaceId,
      ...(filters.platform && { platform: filters.platform }),
      ...(filters.creatorHandle && { 
        creatorHandle: { contains: filters.creatorHandle, mode: 'insensitive' } 
      }),
      ...(filters.hashtag && { hashtags: { has: filters.hashtag.toLowerCase() } }),
      ...(filters.search && {
        OR: [
          { caption: { contains: filters.search, mode: 'insensitive' } },
          { creatorHandle: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
      ...(filters.from && { postedAt: { gte: filters.from } }),
      ...(filters.to && { postedAt: { lte: filters.to } }),
    };

    // Filter by rights status if specified
    if (filters.rightsStatus) {
      where.rightsRequest = { status: filters.rightsStatus };
    }

    const [posts, total] = await Promise.all([
      prisma.ugcPost.findMany({
        where,
        include: {
          rightsRequest: { select: { id: true, status: true } },
          mediaAssets: { select: { id: true, type: true, status: true, storageUrl: true } },
          _count: { select: { contentProductMaps: true } },
        },
        orderBy: { [filters.sortBy]: filters.sortOrder },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.ugcPost.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: posts,
        total,
        page: filters.page,
        limit: filters.limit,
        totalPages: Math.ceil(total / filters.limit),
        hasMore: filters.page * filters.limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching UGC posts:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch posts' } },
      { status: 500 }
    );
  }
}

// POST /api/workspaces/[slug]/ugc - Import a UGC post manually with logging
export async function POST(request: NextRequest, { params }: Params) {
  const logger = new ImportLogger({
    workspaceId: '',
    source: 'manual',
    totalItems: 1,
  });

  try {
    const context = await getWorkspaceContext(params.slug);
    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Workspace not found' } },
        { status: 404 }
      );
    }

    // Initialize logger with workspace ID
    (logger as any).workspaceId = context.workspaceId;

    if (!hasPermission(context.role, 'write')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Start import log
    await logger.start();
    await logger.info('VALIDATING', 'Starting UGC import', { 
      postUrl: body.postUrl,
      platform: body.platform,
    });

    // Validate input
    const validation = importUgcManualSchema.safeParse(body);

    if (!validation.success) {
      await logger.error('VALIDATING', 'Validation failed', {
        errors: validation.error.flatten().fieldErrors,
      });
      await logger.fail('Invalid input data');

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: validation.error.flatten().fieldErrors,
          },
          importLogId: logger.getLogId(),
        },
        { status: 400 }
      );
    }

    await logger.success('VALIDATING', 'Input validation passed');

    const { postUrl, platform, creatorHandle, creatorName, caption, hashtags, postedAt } = validation.data;

    // Check for duplicates
    await logger.info('CHECKING_DUPLICATE', 'Checking for existing imports', { postUrl, platform });
    
    const existing = await prisma.ugcPost.findFirst({
      where: { workspaceId: context.workspaceId, platform, postUrl },
    });

    if (existing) {
      await logger.warning('CHECKING_DUPLICATE', 'Post already imported', {
        existingPostId: existing.id,
        creatorHandle: existing.creatorHandle,
      });
      await logger.fail('Duplicate post detected');

      return NextResponse.json(
        { 
          success: false, 
          error: { code: 'DUPLICATE', message: 'This post has already been imported' },
          importLogId: logger.getLogId(),
        },
        { status: 409 }
      );
    }

    await logger.success('CHECKING_DUPLICATE', 'No duplicate found');

    // Extract hashtags
    await logger.info('EXTRACTING_HASHTAGS', 'Processing hashtags from caption');
    
    const extractedHashtags = hashtags || (caption?.match(/#[\w]+/g)?.map(t => t.slice(1).toLowerCase()) || []);
    
    await logger.success('EXTRACTING_HASHTAGS', `Found ${extractedHashtags.length} hashtags`, {
      hashtags: extractedHashtags,
    });

    // Create post
    await logger.info('CREATING_POST', 'Creating UGC post record');
    
    let post;
    try {
      post = await prisma.ugcPost.create({
        data: {
          workspaceId: context.workspaceId,
          platform,
          postUrl,
          creatorHandle,
          creatorName,
          caption,
          hashtags: extractedHashtags,
          postedAt,
          importSource: 'manual',
        },
        include: {
          rightsRequest: true,
        },
      });
      
      await logger.success('CREATING_POST', 'UGC post created', {
        postId: post.id,
        creatorHandle: post.creatorHandle,
      });
    } catch (dbError) {
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
      await logger.error('CREATING_POST', 'Failed to create post', { error: errorMessage });
      await logger.fail('Database error while creating post');
      throw dbError;
    }

    // Create rights request
    await logger.info('CREATING_RIGHTS_REQUEST', 'Creating rights request');
    
    try {
      await prisma.rightsRequest.create({
        data: {
          workspaceId: context.workspaceId,
          ugcPostId: post.id,
          status: 'PENDING',
        },
      });
      
      await logger.success('CREATING_RIGHTS_REQUEST', 'Rights request created with PENDING status');
    } catch (dbError) {
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
      await logger.warning('CREATING_RIGHTS_REQUEST', 'Failed to create rights request', { error: errorMessage });
      // Don't fail the entire import for this
    }

    // Add audit log
    await addAuditLog({
      workspaceId: context.workspaceId,
      userId: context.userId,
      action: 'CREATE',
      entityType: 'ugc_post',
      entityId: post.id,
      newData: { creatorHandle, platform },
    });

    // Complete the import
    await logger.updateProgress(1, 1, 0);
    await logger.complete('COMPLETED');

    return NextResponse.json({ 
      success: true, 
      data: { post },
      importLogId: logger.getLogId(),
    }, { status: 201 });
  } catch (error) {
    console.error('Error importing UGC post:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (logger.getLogId()) {
      await logger.error('FAILED', 'Import failed with error', { error: errorMessage });
      await logger.fail(errorMessage);
    }

    return NextResponse.json(
      { 
        success: false, 
        error: { code: 'INTERNAL_ERROR', message: 'Failed to import post' },
        importLogId: logger.getLogId(),
      },
      { status: 500 }
    );
  }
}
