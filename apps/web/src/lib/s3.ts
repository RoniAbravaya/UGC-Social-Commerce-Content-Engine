/**
 * S3-compatible storage client
 * Supports AWS S3, Cloudflare R2, and MinIO
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getStorageConfig } from './env';

let s3Client: S3Client | null = null;

/**
 * Get or create S3 client instance
 */
export function getS3Client(): S3Client {
  if (s3Client) {
    return s3Client;
  }

  const config = getStorageConfig();

  s3Client = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: config.secretKey,
    },
    forcePathStyle: true, // Required for MinIO and some S3-compatible services
  });

  return s3Client;
}

/**
 * Generate a presigned URL for uploading a file
 */
export async function getUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  const config = getStorageConfig();
  const client = getS3Client();

  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Generate a presigned URL for downloading a file
 */
export async function getDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const config = getStorageConfig();
  const client = getS3Client();

  const command = new GetObjectCommand({
    Bucket: config.bucket,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Upload a file directly (for server-side uploads)
 */
export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType: string
): Promise<string> {
  const config = getStorageConfig();
  const client = getS3Client();

  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await client.send(command);

  // Return public URL
  return `${config.publicUrl}/${key}`;
}

/**
 * Delete a file
 */
export async function deleteFile(key: string): Promise<void> {
  const config = getStorageConfig();
  const client = getS3Client();

  const command = new DeleteObjectCommand({
    Bucket: config.bucket,
    Key: key,
  });

  await client.send(command);
}

/**
 * Generate a storage key for media assets
 */
export function generateMediaKey(
  workspaceId: string,
  type: 'video' | 'image' | 'caption' | 'thumbnail',
  filename: string
): string {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${workspaceId}/${type}/${timestamp}-${sanitizedFilename}`;
}

/**
 * Get public URL for a storage key
 */
export function getPublicUrl(key: string): string {
  const config = getStorageConfig();
  return `${config.publicUrl}/${key}`;
}
