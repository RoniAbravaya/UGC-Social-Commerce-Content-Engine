/**
 * Import Logs Button - Opens the import logs panel
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ImportLogsPanel } from './import-logs-panel';

interface ImportLogsButtonProps {
  slug: string;
  hasErrors?: boolean;
}

export function ImportLogsButton({ slug, hasErrors }: ImportLogsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <Button 
        variant="outline" 
        onClick={() => setIsOpen(true)}
        className={hasErrors ? 'border-red-300 text-red-600 hover:bg-red-50' : ''}
      >
        📋 Import Logs
        {hasErrors && <span className="ml-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl h-[80vh]">
        <ImportLogsPanel slug={slug} onClose={() => setIsOpen(false)} />
      </div>
    </div>
  );
}
