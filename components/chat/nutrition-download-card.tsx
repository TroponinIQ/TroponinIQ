'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileSpreadsheet, Loader2, CheckCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface NutritionDownloadCardProps {
  type: 'nutrition-summary' | 'macro-tracking' | 'progress-tracking' | 'detailed-meal-plan';
  calculationData?: any;
  userProfile?: any;
  customData?: any;
  className?: string;
}

/**
 * Card component that appears after nutrition calculations to offer downloads
 */
export function NutritionDownloadCard({ 
  type, 
  calculationData, 
  userProfile, 
  customData,
  className = '' 
}: NutritionDownloadCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [fetchedProfile, setFetchedProfile] = useState<any>(null);

  // Fetch user profile if not provided
  React.useEffect(() => {
    if (!userProfile && !fetchedProfile) {
      const fetchProfile = async () => {
        try {
          const response = await fetch('/api/user/profile');
          if (response.ok) {
            const data = await response.json();
            setFetchedProfile(data.profile);
          }
        } catch (error) {
          console.error('Failed to fetch user profile for download:', error);
        }
      };
      fetchProfile();
    }
  }, [userProfile, fetchedProfile]);

  const handleDownload = async () => {
    if (isDownloading || downloadComplete) return;

    const profileToUse = userProfile || fetchedProfile;
    
    setIsDownloading(true);
    
    try {
      console.log(`[Nutrition Download] Requesting ${type} spreadsheet...`);
      
      const response = await fetch('/api/download/nutrition-spreadsheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          userProfile: profileToUse,
          customData: {
            ...customData,
            calculationData
          }
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

      console.log(`[Nutrition Download] Successfully downloaded: ${filename}`);
      toast.success(`Downloaded ${filename}`);
      setDownloadComplete(true);

    } catch (error: any) {
      console.error('[Nutrition Download] Error:', error);
      toast.error(error.message || 'Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const getDownloadInfo = () => {
    const profileToUse = userProfile || fetchedProfile;
    const hasCompleteProfile = profileToUse?.age && profileToUse?.weight && profileToUse?.height && profileToUse?.gender;
    
    switch (type) {
      case 'nutrition-summary':
        return {
          title: hasCompleteProfile ? 'Your Nutrition Plan' : 'Nutrition Plan Template',
          description: hasCompleteProfile 
            ? 'Download your personalized nutrition plan with BMR, TDEE, and macro calculations'
            : 'Download a nutrition template (update your profile for personalized calculations)',
          icon: FileText,
          filename: 'nutrition-plan.csv'
        };
      case 'macro-tracking':
        return {
          title: hasCompleteProfile ? 'Your Macro Tracker' : 'Macro Tracking Template',
          description: hasCompleteProfile
            ? 'Download a tracking template with your personalized macro targets'
            : 'Download a macro tracking template (update your profile for personalized targets)',
          icon: FileSpreadsheet,
          filename: 'macro-tracking.csv'
        };
      case 'progress-tracking':
        return {
          title: 'Progress Tracking Template',
          description: 'Download a template to track your weight, measurements, and progress',
          icon: FileSpreadsheet,
          filename: 'progress-tracking.csv'
        };
      case 'detailed-meal-plan':
        return {
          title: 'Meal Planning Template',
          description: 'Download a comprehensive meal planning template with timing and shopping lists',
          icon: FileSpreadsheet,
          filename: 'meal-plan-template.csv'
        };
      default:
        return {
          title: 'Nutrition Spreadsheet',
          description: 'Download your nutrition data',
          icon: FileSpreadsheet,
          filename: 'nutrition-data.csv'
        };
    }
  };

  const downloadInfo = getDownloadInfo();
  const IconComponent = downloadInfo.icon;
  const profileToUse = userProfile || fetchedProfile;
  const hasCompleteProfile = profileToUse?.age && profileToUse?.weight && profileToUse?.height && profileToUse?.gender;

  return (
    <Card className={`border border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <IconComponent className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm text-green-800 dark:text-green-200">
                {downloadInfo.title}
              </CardTitle>
              {!hasCompleteProfile && (type === 'nutrition-summary' || type === 'macro-tracking') && (
                <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full dark:bg-orange-900/20 dark:text-orange-300">
                  Template
                </span>
              )}
              {hasCompleteProfile && (type === 'nutrition-summary' || type === 'macro-tracking') && (
                <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full dark:bg-blue-900/20 dark:text-blue-300">
                  Personalized
                </span>
              )}
            </div>
            <CardDescription className="text-xs text-green-700 dark:text-green-300 mt-1">
              {downloadInfo.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            CSV format • Ready to use in Excel or Google Sheets
          </div>
          
          <Button
            onClick={handleDownload}
            disabled={isDownloading || downloadComplete}
            variant={downloadComplete ? "secondary" : "default"}
            size="sm"
            className={downloadComplete ? "text-green-700 dark:text-green-300" : ""}
          >
            {downloadComplete ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Downloaded
              </>
            ) : isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download CSV
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Simple trigger component that can be embedded in markdown
 */
export function NutritionDownloadTrigger({ 
  type, 
  userProfile 
}: { 
  type: string; 
  userProfile?: any;
}) {
  return (
    <div className="my-4">
      <NutritionDownloadCard 
        type={type as any}
        userProfile={userProfile}
      />
    </div>
  );
}
