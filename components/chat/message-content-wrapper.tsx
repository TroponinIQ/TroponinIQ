'use client';

import { type ReactNode, useMemo } from 'react';
import { Markdown } from '../common/markdown';
import { NutritionDownloadCard } from './nutrition-download-card';
import { ExportButton } from './export-button';
import { EasterEggMessage } from './easter-egg-message';
import {
  ManualProfileUpdateButton,
  shouldShowProfileUpdateButton,
} from './manual-profile-update-button';

interface MessageContentWrapperProps {
  content: string;
  userProfile?: any;
  children?: ReactNode;
  messageRole?: 'user' | 'assistant';
  easterEgg?: {
    type: string;
    content: string;
  };
  previousUserMessage?: any;
}

/**
 * Wrapper component that processes message content and adds download cards
 * when nutrition download triggers are detected
 */
export function MessageContentWrapper({
  content,
  userProfile,
  children,
  messageRole,
  easterEgg,
  previousUserMessage,
}: MessageContentWrapperProps) {
  // Simple profile update button detection (much simpler than auto-detection)
  const showManualProfileButton = useMemo(() => {
    return (
      messageRole === 'assistant' && shouldShowProfileUpdateButton(content)
    );
  }, [content, messageRole]);

  // Parse content for download triggers only
  const { cleanContent, downloadTriggers } = useMemo(() => {
    const downloadTriggers: Array<{ type: string; position: number }> = [];

    // Parse download triggers
    const downloadTriggerRegex =
      /<!--\s*NUTRITION_DOWNLOAD_TRIGGER:(\w+(?:-\w+)*)\s*-->/g;
    let match: RegExpExecArray | null;

    match = downloadTriggerRegex.exec(content);
    while (match !== null) {
      const [fullMatch, downloadType] = match;
      downloadTriggers.push({
        type: downloadType,
        position: match.index,
      });
      match = downloadTriggerRegex.exec(content);
    }

    // Remove download triggers from content
    const cleanedContent = content.replace(downloadTriggerRegex, '');

    return {
      cleanContent: cleanedContent,
      downloadTriggers,
    };
  }, [content]);

  // Detect Easter eggs from previous user message (proper approach)
  const easterEggType = useMemo(() => {
    if (messageRole !== 'assistant' || !previousUserMessage) return null;

    // Get the user's question text
    const userText =
      previousUserMessage.parts?.[0]?.text || previousUserMessage.content || '';
    const lowerUserText = userText.toLowerCase().trim();

    // Check for Easter egg trigger phrases
    const easterEggPatterns = [
      'show me the best workout ever',
      'what is the best workout ever',
      'best workout of all time',
      'tell me about project super heavyweight',
      'what is project super heavyweight',
    ];

    for (const pattern of easterEggPatterns) {
      if (lowerUserText.includes(pattern)) {
        return 'project-superheavyweight';
      }
    }

    return null;
  }, [messageRole, previousUserMessage]);

  // Easter egg content for display
  const easterEggContent = `The best workout ever? That's subjective, but I'll share something special with you - back in 2007, I documented my training methodology in "Project Super Heavyweight." It captures the exact approach I used during my competitive powerlifting career when I was totaling Elite numbers.

You can check it out here: https://www.youtube.com/watch?v=Ld41RdDru40&t

This isn't just another workout video - it's a deep dive into the mindset, programming, and techniques that took me to championship level. The principles still apply whether you're a beginner or advanced lifter.

What specific aspect of training are you most interested in improving?`;

  // Render content with interactive components
  return (
    <div className="space-y-4 group/content">
      <Markdown>{cleanContent}</Markdown>

      {/* Show Easter egg after normal content if present */}
      {easterEggType && (
        <EasterEggMessage
          content={easterEggContent}
          type={
            easterEggType as
              | 'project-superheavyweight'
              | 'mr-michigan'
              | 'powerlifting-champion'
              | 'general'
          }
          className="mt-4"
        />
      )}

      {/* Simple export button for assistant responses only */}
      {messageRole === 'assistant' && (
        <div className="flex justify-between items-center opacity-0 group-hover/content:opacity-100 transition-opacity">
          {/* Manual profile update button (simple, proven approach) */}
          {showManualProfileButton && (
            <ManualProfileUpdateButton
              className="mr-2"
              userProfile={userProfile}
            />
          )}

          <ExportButton
            content={cleanContent}
            filename={easterEggType ? 'easter-egg-discovery' : 'ai-response'}
            className="text-xs"
          />
        </div>
      )}

      {downloadTriggers.map((trigger, index) => (
        <NutritionDownloadCard
          key={`download-${trigger.type}-${index}`}
          type={trigger.type as any}
          userProfile={userProfile}
          className="mt-4"
        />
      ))}
    </div>
  );
}
