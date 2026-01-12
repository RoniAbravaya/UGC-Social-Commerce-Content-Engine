/**
 * Import Logs Panel - Display import history and detailed logs
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ImportLogEntry {
  id: string;
  step: string;
  status: string;
  message: string;
  details: Record<string, unknown> | null;
  duration: number | null;
  createdAt: string;
}

interface ImportLog {
  id: string;
  source: string;
  status: string;
  totalItems: number;
  processed: number;
  succeeded: number;
  failed: number;
  metadata: Record<string, unknown> | null;
  startedAt: string;
  completedAt: string | null;
  entries: ImportLogEntry[];
}

interface ImportLogsPanelProps {
  slug: string;
  onClose?: () => void;
  currentLogId?: string | null;
}

export function ImportLogsPanel({ slug, onClose, currentLogId }: ImportLogsPanelProps) {
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<ImportLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [slug]);

  useEffect(() => {
    if (currentLogId) {
      fetchLogDetail(currentLogId);
    }
  }, [currentLogId]);

  async function fetchLogs() {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/workspaces/${slug}/ugc/import-logs?limit=10`);
      const data = await response.json();
      if (data.success) {
        setLogs(data.data.logs);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchLogDetail(logId: string) {
    setIsLoadingDetail(true);
    try {
      const response = await fetch(`/api/workspaces/${slug}/ugc/import-logs/${logId}`);
      const data = await response.json();
      if (data.success) {
        setSelectedLog(data.data.log);
      }
    } catch (error) {
      console.error('Failed to fetch log detail:', error);
    } finally {
      setIsLoadingDetail(false);
    }
  }

  const statusColors: Record<string, string> = {
    PENDING: 'bg-gray-100 text-gray-700',
    PROCESSING: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700',
    FAILED: 'bg-red-100 text-red-700',
    PARTIAL: 'bg-yellow-100 text-yellow-700',
  };

  const stepIcons: Record<string, string> = {
    VALIDATING: '🔍',
    CHECKING_DUPLICATE: '🔄',
    EXTRACTING_HASHTAGS: '#️⃣',
    CREATING_POST: '📝',
    CREATING_RIGHTS_REQUEST: '✅',
    FETCHING_MEDIA: '📥',
    COMPLETED: '🎉',
    FAILED: '❌',
  };

  const entryStatusColors: Record<string, string> = {
    success: 'text-green-600 bg-green-50 border-green-200',
    error: 'text-red-600 bg-red-50 border-red-200',
    warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    info: 'text-blue-600 bg-blue-50 border-blue-200',
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Import Logs</CardTitle>
            <CardDescription>View import history and detailed logs</CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden flex flex-col">
        {selectedLog ? (
          // Detailed log view
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="sm" onClick={() => setSelectedLog(null)}>
                ← Back to list
              </Button>
              <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[selectedLog.status]}`}>
                {selectedLog.status}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-4 text-center">
              <div className="bg-muted rounded p-2">
                <div className="text-lg font-bold">{selectedLog.totalItems}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="bg-muted rounded p-2">
                <div className="text-lg font-bold text-green-600">{selectedLog.succeeded}</div>
                <div className="text-xs text-muted-foreground">Success</div>
              </div>
              <div className="bg-muted rounded p-2">
                <div className="text-lg font-bold text-red-600">{selectedLog.failed}</div>
                <div className="text-xs text-muted-foreground">Failed</div>
              </div>
              <div className="bg-muted rounded p-2">
                <div className="text-lg font-bold">{selectedLog.processed}</div>
                <div className="text-xs text-muted-foreground">Processed</div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {isLoadingDetail ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : selectedLog.entries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No log entries</div>
              ) : (
                selectedLog.entries.map((entry) => (
                  <div 
                    key={entry.id} 
                    className={`p-3 rounded border ${entryStatusColors[entry.status] || 'bg-gray-50'}`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{stepIcons[entry.step] || '📋'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{entry.step.replace(/_/g, ' ')}</span>
                          {entry.duration && (
                            <span className="text-xs text-muted-foreground">{entry.duration}ms</span>
                          )}
                        </div>
                        <p className="text-sm mt-0.5">{entry.message}</p>
                        {entry.details && Object.keys(entry.details).length > 0 && (
                          <details className="mt-2">
                            <summary className="text-xs text-muted-foreground cursor-pointer">
                              View details
                            </summary>
                            <pre className="text-xs mt-1 p-2 bg-black/5 rounded overflow-x-auto">
                              {JSON.stringify(entry.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          // Log list view
          <div className="flex-1 overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No import history yet</div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedLog(log);
                    if (log.entries.length === 0) {
                      fetchLogDetail(log.id);
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm capitalize">{log.source} Import</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[log.status]}`}>
                      {log.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{log.totalItems} item{log.totalItems !== 1 ? 's' : ''}</span>
                    <span className="text-green-600">{log.succeeded} ok</span>
                    {log.failed > 0 && <span className="text-red-600">{log.failed} failed</span>}
                    <span>{new Date(log.startedAt).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact import status for dialogs
 */
interface ImportStatusProps {
  logId: string | null;
  slug: string;
  onViewLogs?: () => void;
}

export function ImportStatus({ logId, slug, onViewLogs }: ImportStatusProps) {
  const [log, setLog] = useState<ImportLog | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (logId) {
      fetchLog();
    }
  }, [logId]);

  async function fetchLog() {
    if (!logId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/workspaces/${slug}/ugc/import-logs/${logId}`);
      const data = await response.json();
      if (data.success) {
        setLog(data.data.log);
      }
    } catch (error) {
      console.error('Failed to fetch log:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (!logId || isLoading) return null;
  if (!log) return null;

  const hasErrors = log.entries.some(e => e.status === 'error');
  const lastEntry = log.entries[log.entries.length - 1];

  return (
    <div className={`mt-4 p-3 rounded-lg border ${
      log.status === 'COMPLETED' ? 'bg-green-50 border-green-200' :
      log.status === 'FAILED' ? 'bg-red-50 border-red-200' :
      log.status === 'PARTIAL' ? 'bg-yellow-50 border-yellow-200' :
      'bg-blue-50 border-blue-200'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">
          {log.status === 'COMPLETED' ? '✅ Import Successful' :
           log.status === 'FAILED' ? '❌ Import Failed' :
           log.status === 'PARTIAL' ? '⚠️ Partial Success' :
           '⏳ Processing...'}
        </span>
        {onViewLogs && (
          <Button variant="ghost" size="sm" onClick={onViewLogs}>
            View Details
          </Button>
        )}
      </div>
      
      {lastEntry && (
        <p className="text-sm text-muted-foreground">{lastEntry.message}</p>
      )}

      {hasErrors && (
        <div className="mt-2 space-y-1">
          <p className="text-xs font-medium text-red-600">Errors:</p>
          {log.entries
            .filter(e => e.status === 'error')
            .slice(0, 3)
            .map((entry, idx) => (
              <p key={idx} className="text-xs text-red-600">• {entry.message}</p>
            ))}
          {log.entries.filter(e => e.status === 'error').length > 3 && (
            <p className="text-xs text-muted-foreground">
              +{log.entries.filter(e => e.status === 'error').length - 3} more errors
            </p>
          )}
        </div>
      )}
    </div>
  );
}
