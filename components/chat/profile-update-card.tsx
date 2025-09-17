'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, User, Check, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export interface ProfileUpdateSuggestion {
  field: string;
  currentValue: any;
  suggestedValue: any;
  confidence: number;
  reason: string;
  displayName: string;
  unit?: string;
}

interface ProfileUpdateCardProps {
  suggestions: ProfileUpdateSuggestion[];
  onApprove: (suggestions: ProfileUpdateSuggestion[]) => Promise<void>;
  onDismiss: () => void;
  className?: string;
}

export function ProfileUpdateCard({
  suggestions,
  onApprove,
  onDismiss,
  className = '',
}: ProfileUpdateCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(
    new Set(suggestions.map((s) => s.field)),
  );

  const handleApprove = async () => {
    try {
      setIsUpdating(true);
      const approvedSuggestions = suggestions.filter((s) =>
        selectedSuggestions.has(s.field),
      );

      await onApprove(approvedSuggestions);
      toast.success(
        `Updated ${approvedSuggestions.length} profile field${approvedSuggestions.length > 1 ? 's' : ''}`,
      );
    } catch (error) {
      console.error('Profile update failed:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleSuggestion = (field: string) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(field)) {
      newSelected.delete(field);
    } else {
      newSelected.add(field);
    }
    setSelectedSuggestions(newSelected);
  };

  const formatValue = (value: any, unit?: string) => {
    if (value === null || value === undefined) return 'Not set';
    return unit ? `${value}${unit}` : value.toString();
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8)
      return (
        <Badge variant="default" className="text-xs">
          High
        </Badge>
      );
    if (confidence >= 0.6)
      return (
        <Badge variant="secondary" className="text-xs">
          Medium
        </Badge>
      );
    return (
      <Badge variant="outline" className="text-xs">
        Low
      </Badge>
    );
  };

  return (
    <Card
      className={`w-full max-w-2xl mx-auto border-blue-200 bg-blue-50/50 ${className}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-sm font-medium text-blue-900">
              Profile Update Suggestions
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-xs text-blue-700">
          I noticed you mentioned some personal details. Would you like me to
          update your profile?
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.field}
            role="button"
            tabIndex={0}
            className={`p-3 rounded-lg border transition-all cursor-pointer ${
              selectedSuggestions.has(suggestion.field)
                ? 'border-blue-300 bg-blue-100/50'
                : 'border-gray-200 bg-white hover:border-blue-200'
            }`}
            onClick={() => toggleSuggestion(suggestion.field)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleSuggestion(suggestion.field);
              }
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    selectedSuggestions.has(suggestion.field)
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}
                >
                  {selectedSuggestions.has(suggestion.field) && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </div>
                <span className="font-medium text-sm text-gray-900">
                  {suggestion.displayName}
                </span>
                {getConfidenceBadge(suggestion.confidence)}
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 ml-6">
              <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                {formatValue(suggestion.currentValue, suggestion.unit)}
              </span>
              <ArrowRight className="h-3 w-3" />
              <span className="px-2 py-1 bg-blue-100 rounded text-xs font-medium">
                {formatValue(suggestion.suggestedValue, suggestion.unit)}
              </span>
            </div>

            <div className="text-xs text-gray-500 mt-1 ml-6">
              {suggestion.reason}
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-gray-500">
            {selectedSuggestions.size} of {suggestions.length} selected
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onDismiss}
              className="text-xs h-8"
            >
              Dismiss
            </Button>
            <Button
              size="sm"
              onClick={handleApprove}
              disabled={isUpdating || selectedSuggestions.size === 0}
              className="text-xs h-8"
            >
              {isUpdating ? 'Updating...' : `Update Profile`}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Hook for managing profile update state
 */
export function useProfileUpdates() {
  const [suggestions, setSuggestions] = useState<ProfileUpdateSuggestion[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  const showSuggestions = (newSuggestions: ProfileUpdateSuggestion[]) => {
    if (newSuggestions.length > 0) {
      setSuggestions(newSuggestions);
      setIsVisible(true);
    }
  };

  const hideSuggestions = () => {
    setIsVisible(false);
    setSuggestions([]);
  };

  const handleApprove = async (
    approvedSuggestions: ProfileUpdateSuggestion[],
  ) => {
    try {
      // Convert suggestions to profile update format
      const updateData: Record<string, any> = {};

      for (const suggestion of approvedSuggestions) {
        updateData[suggestion.field] = suggestion.suggestedValue;
      }

      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      hideSuggestions();

      // Trigger a profile refresh (you might want to add this to your app's state management)
      window.dispatchEvent(new CustomEvent('profile-updated'));
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  return {
    suggestions,
    isVisible,
    showSuggestions,
    hideSuggestions,
    handleApprove,
  };
}
