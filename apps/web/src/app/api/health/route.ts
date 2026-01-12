/**
 * Health check endpoint for Railway deployment
 * Returns 200 OK if the application is running
 */

import { NextResponse } from 'next/server';
import { prisma } from '@ugc/database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const health: {
    status: 'ok' | 'degraded' | 'error';
    timestamp: string;
    services: {
      database: 'connected' | 'disconnected';
    };
    version: string;
  } = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'disconnected',
    },
    version: process.env.npm_package_version || '0.1.0',
  };

  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    health.services.database = 'connected';
  } catch (error) {
    health.status = 'degraded';
    health.services.database = 'disconnected';
    console.error('Health check: Database connection failed', error);
  }

  const statusCode = health.status === 'ok' ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}
