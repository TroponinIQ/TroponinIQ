'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface SpreadsheetDownloadButtonProps {
  type: string;
  label?: string;
  customData?: any;
  userProfile?: any;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  disabled?: boolean;
}

/**
 * Button component for downloading nutrition spreadsheets
 * Integrates with the /api/download/nutrition-spreadsheet endpoint
 */
export function SpreadsheetDownloadButton({
  type,
  label,
  customData,
  userProfile,
  className,
  variant = 'outline',
  size = 'sm',
  disabled = false
}: SpreadsheetDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (isDownloading) return;

    setIsDownloading(true);
    
    try {
      console.log(`[Download] Requesting ${type} spreadsheet...`);
      
      const response = await fetch('/api/download/nutrition-spreadsheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          userProfile,
          customData
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Download failed');
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('content-disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || `${type}-spreadsheet.csv`;

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log(`[Download] Successfully downloaded: ${filename}`);
      toast.success(`Downloaded ${filename}`);

    } catch (error: any) {
      console.error('[Download] Error:', error);
      toast.error(error.message || 'Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Get appropriate label if not provided
  const displayLabel = label || getDefaultLabel(type);

  return (
    <Button
      onClick={handleDownload}
      disabled={isDownloading || disabled}
      variant={variant}
      size={size}
      className={className}
    >
      {isDownloading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Download className="w-4 h-4 mr-2" />
      )}
      {isDownloading ? 'Downloading...' : displayLabel}
    </Button>
  );
}

/**
 * Component that displays available spreadsheet types for download
 */
export function SpreadsheetDownloadMenu({ userProfile }: { userProfile?: any }) {
  const [availableTypes, setAvailableTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load available types on mount
  React.useEffect(() => {
    async function loadTypes() {
      try {
        const response = await fetch('/api/download/nutrition-spreadsheet');
        if (response.ok) {
          const data = await response.json();
          setAvailableTypes(data.types || []);
        }
      } catch (error) {
        console.error('Failed to load spreadsheet types:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadTypes();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        Loading spreadsheet options...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <FileSpreadsheet className="w-4 h-4" />
        Available Downloads
      </div>
      
      <div className="grid gap-2">
        {availableTypes.map((type) => (
          <div key={type.type} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex-1">
              <div className="font-medium text-sm">{type.name}</div>
              <div className="text-xs text-muted-foreground">{type.description}</div>
              {type.requiresProfile && !userProfile && (
                <div className="text-xs text-orange-600 mt-1">
                  ⚠️ Requires complete profile
                </div>
              )}
            </div>
            
            <SpreadsheetDownloadButton
              type={type.type}
              label="Download"
              userProfile={userProfile}
              size="sm"
              variant="outline"
              disabled={type.requiresProfile && !userProfile}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Get default label for spreadsheet type
 */
function getDefaultLabel(type: string): string {
  const labels: Record<string, string> = {
    'nutrition-summary': 'Download Nutrition Plan',
    'progress-tracking': 'Download Progress Tracker',
    'macro-tracking': 'Download Macro Tracker',
    'meal-plan': 'Download Meal Plan',
    'detailed-meal-plan': 'Download Meal Plan Template',
    'shopping-list': 'Download Shopping List',
    'weekly-summary': 'Download Weekly Summary',
    'analysis-report': 'Download Analysis Report'
  };

  return labels[type] || 'Download Spreadsheet';
}
