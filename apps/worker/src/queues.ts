/**
 * Queue definitions and job creation helpers
 */

import { Queue, QueueEvents } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const QUEUE_NAMES = {
  MEDIA_DOWNLOAD: 'media-download',
  MEDIA_TRANSCODE: 'media-transcode',
  CLIP_GENERATION: 'clip-generation',
  CAPTION_GENERATION: 'caption-generation',
  UGC_INGESTION: 'ugc-ingestion',
};

// Create queues
export const mediaDownloadQueue = new Queue(QUEUE_NAMES.MEDIA_DOWNLOAD, { connection });
export const mediaTranscodeQueue = new Queue(QUEUE_NAMES.MEDIA_TRANSCODE, { connection });
export const clipGenerationQueue = new Queue(QUEUE_NAMES.CLIP_GENERATION, { connection });
export const captionGenerationQueue = new Queue(QUEUE_NAMES.CAPTION_GENERATION, { connection });
export const ugcIngestionQueue = new Queue(QUEUE_NAMES.UGC_INGESTION, { connection });

// Job creation helpers
export async function queueMediaDownload(mediaAssetId: string, sourceUrl: string) {
  return mediaDownloadQueue.add(
    'download',
    { mediaAssetId, sourceUrl },
    {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 1000,
    }
  );
}

export async function queueMediaTranscode(
  mediaAssetId: string,
  format: 'VERTICAL_9_16' | 'SQUARE_1_1' | 'HORIZONTAL_16_9',
  outputPath: string
) {
  return mediaTranscodeQueue.add(
    'transcode',
    { mediaAssetId, format, outputPath },
    {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 1000,
    }
  );
}

export async function queueClipGeneration(
  repurposeJobId: string,
  sourceMediaAssetId: string,
  params: {
    durations: number[];
    formats: string[];
    generateCaptions: boolean;
    burnInCaptions: boolean;
  }
) {
  return clipGenerationQueue.add(
    'generate-clips',
    { repurposeJobId, sourceMediaAssetId, params },
    {
      attempts: 3,
      backoff: { type: 'exponential', delay: 10000 },
      removeOnComplete: 100,
      removeOnFail: 1000,
    }
  );
}

export async function queueCaptionGeneration(clipId: string, language: string = 'en') {
  return captionGenerationQueue.add(
    'generate-captions',
    { clipId, language },
    {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 1000,
    }
  );
}

export async function queueUgcIngestion(
  workspaceId: string,
  platform: 'TIKTOK' | 'INSTAGRAM' | 'YOUTUBE',
  searchCriteria: {
    hashtags?: string[];
    mentions?: string[];
    handles?: string[];
  }
) {
  return ugcIngestionQueue.add(
    'ingest-ugc',
    { workspaceId, platform, searchCriteria },
    {
      attempts: 3,
      backoff: { type: 'exponential', delay: 30000 },
      removeOnComplete: 100,
      removeOnFail: 1000,
    }
  );
}
