/**
 * Environment variable validation and configuration
 * Provides type-safe access to environment variables with sensible defaults for development
 */

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Validate that a required environment variable is set
 */
function requireEnv(name: string, defaultValue?: string): string {
  const value = process.env[name] || defaultValue;
  
  if (!value && isProduction) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  
  if (!value) {
    console.warn(`Warning: Environment variable ${name} is not set. Using empty string.`);
    return '';
  }
  
  return value;
}

/**
 * Get an optional environment variable with a default
 */
function optionalEnv(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

/**
 * S3-compatible storage configuration
 * Uses MinIO defaults for development, requires explicit config for production
 */
export function getStorageConfig() {
  if (isProduction) {
    // In production, all S3 variables are required
    const endpoint = requireEnv('S3_ENDPOINT');
    const accessKey = requireEnv('S3_ACCESS_KEY');
    const secretKey = requireEnv('S3_SECRET_KEY');
    const bucket = requireEnv('S3_BUCKET');
    const region = optionalEnv('S3_REGION', 'auto');
    const publicUrl = optionalEnv('S3_PUBLIC_URL', endpoint);

    return {
      endpoint,
      accessKey,
      secretKey,
      bucket,
      region,
      publicUrl,
      isProduction: true,
    };
  }

  // Development defaults (MinIO)
  return {
    endpoint: optionalEnv('S3_ENDPOINT', 'http://localhost:9000'),
    accessKey: optionalEnv('S3_ACCESS_KEY', 'minioadmin'),
    secretKey: optionalEnv('S3_SECRET_KEY', 'minioadmin'),
    bucket: optionalEnv('S3_BUCKET', 'ugc-media'),
    region: optionalEnv('S3_REGION', 'us-east-1'),
    publicUrl: optionalEnv('S3_PUBLIC_URL', 'http://localhost:9000/ugc-media'),
    isProduction: false,
  };
}

/**
 * Redis configuration
 */
export function getRedisConfig() {
  const url = isProduction
    ? requireEnv('REDIS_URL')
    : optionalEnv('REDIS_URL', 'redis://localhost:6379');

  return { url };
}

/**
 * Database configuration
 */
export function getDatabaseConfig() {
  const url = isProduction
    ? requireEnv('DATABASE_URL')
    : optionalEnv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/ugc_commerce');

  return { url };
}

/**
 * Auth configuration
 */
export function getAuthConfig() {
  return {
    url: requireEnv('NEXTAUTH_URL', isProduction ? undefined : 'http://localhost:3000'),
    secret: requireEnv('NEXTAUTH_SECRET', isProduction ? undefined : 'dev-secret-change-in-production'),
  };
}

/**
 * Validate all required environment variables at startup
 * Call this in a server component or API route to fail fast
 */
export function validateEnv(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (isProduction) {
    const requiredVars = [
      'DATABASE_URL',
      'REDIS_URL',
      'NEXTAUTH_URL',
      'NEXTAUTH_SECRET',
      'S3_ENDPOINT',
      'S3_ACCESS_KEY',
      'S3_SECRET_KEY',
      'S3_BUCKET',
    ];

    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        errors.push(`Missing required environment variable: ${varName}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Environment configuration object for easy access
 */
export const env = {
  isProduction,
  isDevelopment: !isProduction,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Lazy getters to avoid validation errors at import time
  get storage() {
    return getStorageConfig();
  },
  get redis() {
    return getRedisConfig();
  },
  get database() {
    return getDatabaseConfig();
  },
  get auth() {
    return getAuthConfig();
  },
};
