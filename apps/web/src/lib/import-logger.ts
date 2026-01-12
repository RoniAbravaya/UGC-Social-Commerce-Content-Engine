/**
 * Import Logger - Utility for tracking import operations with detailed logs
 */

import { prisma, ImportLogStatus, ImportLogStep } from '@ugc/database';

export type LogStatus = 'success' | 'error' | 'warning' | 'info';

export interface ImportLoggerOptions {
  workspaceId: string;
  source: 'manual' | 'csv' | 'api';
  totalItems?: number;
  metadata?: Record<string, unknown>;
}

export class ImportLogger {
  private logId: string | null = null;
  private workspaceId: string;
  private source: string;
  private totalItems: number;
  private metadata: Record<string, unknown>;
  private stepStartTime: number = 0;

  constructor(options: ImportLoggerOptions) {
    this.workspaceId = options.workspaceId;
    this.source = options.source;
    this.totalItems = options.totalItems || 1;
    this.metadata = options.metadata || {};
  }

  /**
   * Initialize the import log
   */
  async start(): Promise<string> {
    const log = await prisma.importLog.create({
      data: {
        workspaceId: this.workspaceId,
        source: this.source,
        status: 'PROCESSING',
        totalItems: this.totalItems,
        metadata: this.metadata ? JSON.parse(JSON.stringify(this.metadata)) : null,
        startedAt: new Date(),
      },
    });
    this.logId = log.id;
    this.stepStartTime = Date.now();
    return log.id;
  }

  /**
   * Add a log entry for a specific step
   */
  async log(
    step: ImportLogStep,
    status: LogStatus,
    message: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    if (!this.logId) {
      throw new Error('ImportLogger not started. Call start() first.');
    }

    const duration = Date.now() - this.stepStartTime;
    this.stepStartTime = Date.now();

    await prisma.importLogEntry.create({
      data: {
        importLogId: this.logId,
        step,
        status,
        message,
        details: details ? JSON.parse(JSON.stringify(details)) : null,
        duration,
      },
    });
  }

  /**
   * Log successful step
   */
  async success(step: ImportLogStep, message: string, details?: Record<string, unknown>): Promise<void> {
    await this.log(step, 'success', message, details);
  }

  /**
   * Log error step
   */
  async error(step: ImportLogStep, message: string, details?: Record<string, unknown>): Promise<void> {
    await this.log(step, 'error', message, details);
  }

  /**
   * Log warning step
   */
  async warning(step: ImportLogStep, message: string, details?: Record<string, unknown>): Promise<void> {
    await this.log(step, 'warning', message, details);
  }

  /**
   * Log info step
   */
  async info(step: ImportLogStep, message: string, details?: Record<string, unknown>): Promise<void> {
    await this.log(step, 'info', message, details);
  }

  /**
   * Update progress counters
   */
  async updateProgress(processed: number, succeeded: number, failed: number): Promise<void> {
    if (!this.logId) return;

    await prisma.importLog.update({
      where: { id: this.logId },
      data: { processed, succeeded, failed },
    });
  }

  /**
   * Mark import as completed
   */
  async complete(status: ImportLogStatus = 'COMPLETED'): Promise<void> {
    if (!this.logId) return;

    await this.log('COMPLETED', 'success', 'Import completed');
    
    await prisma.importLog.update({
      where: { id: this.logId },
      data: {
        status,
        completedAt: new Date(),
      },
    });
  }

  /**
   * Mark import as failed
   */
  async fail(errorMessage: string, details?: Record<string, unknown>): Promise<void> {
    if (!this.logId) return;

    await this.log('FAILED', 'error', errorMessage, details);

    await prisma.importLog.update({
      where: { id: this.logId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
      },
    });
  }

  /**
   * Get the current log ID
   */
  getLogId(): string | null {
    return this.logId;
  }
}

/**
 * Get import logs for a workspace
 */
export async function getImportLogs(workspaceId: string, limit: number = 20) {
  return prisma.importLog.findMany({
    where: { workspaceId },
    include: {
      entries: {
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Get a specific import log with entries
 */
export async function getImportLog(logId: string, workspaceId: string) {
  return prisma.importLog.findFirst({
    where: { id: logId, workspaceId },
    include: {
      entries: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}
