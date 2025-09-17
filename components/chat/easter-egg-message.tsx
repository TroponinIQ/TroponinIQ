'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, Youtube, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface EasterEggMessageProps {
  content: string;
  type:
    | 'project-superheavyweight'
    | 'mr-michigan'
    | 'powerlifting-champion'
    | 'general';
  className?: string;
}

export function EasterEggMessage({
  content,
  type,
  className,
}: EasterEggMessageProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (!hasAnimated) {
      setShowConfetti(true);
      setHasAnimated(true);

      // Auto-hide confetti after animation
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [hasAnimated]);

  const getEasterEggInfo = () => {
    switch (type) {
      case 'project-superheavyweight':
        return {
          title: 'Hidden Training Gem Unlocked',
          subtitle: 'Project Super Heavyweight (2007)',
          icon: Trophy,
          accent: 'ring-2 ring-primary/20',
          bgStyle: 'bg-gradient-to-br from-primary/5 to-primary/10',
          borderColor: 'border-primary/20',
        };
      case 'mr-michigan':
        return {
          title: "Champion's Story Revealed",
          subtitle: '2004 Mr. Michigan Victory',
          icon: Trophy,
          accent: 'ring-2 ring-primary/20',
          bgStyle: 'bg-gradient-to-br from-primary/5 to-primary/10',
          borderColor: 'border-primary/20',
        };
      case 'powerlifting-champion':
        return {
          title: 'Elite Achievement Unlocked',
          subtitle: 'APF Michigan Champion',
          icon: Trophy,
          accent: 'ring-2 ring-primary/20',
          bgStyle: 'bg-gradient-to-br from-primary/5 to-primary/10',
          borderColor: 'border-primary/20',
        };
      default:
        return {
          title: 'Hidden Content Discovered',
          subtitle: 'Exclusive Content',
          icon: Sparkles,
          accent: 'ring-2 ring-primary/20',
          bgStyle: 'bg-gradient-to-br from-primary/5 to-primary/10',
          borderColor: 'border-primary/20',
        };
    }
  };

  const handleShare = async () => {
    console.log('Share button clicked'); // Debug log

    const shareText = `Just discovered hidden content in TroponinIQ! Check out this exclusive training insight from Justin Harris: ${window.location.href}`;

    if (navigator.share && typeof navigator.canShare === 'function') {
      try {
        await navigator.share({
          title: 'TroponinIQ Hidden Content',
          text: shareText,
          url: window.location.href,
        });
        toast.success('Content shared successfully!');
      } catch (error: any) {
        console.error('Share error:', error);
        if (error.name !== 'AbortError') {
          // Fallback to clipboard if share fails
          copyToClipboard(shareText);
        }
      }
    } else {
      copyToClipboard(shareText);
    }
  };

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          toast.success('Share link copied to clipboard!');
        })
        .catch(() => {
          toast.error('Failed to copy to clipboard');
        });
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        toast.success('Share link copied to clipboard!');
      } catch (err) {
        toast.error('Failed to copy to clipboard');
      }
      document.body.removeChild(textArea);
    }
  };

  const handleWatchVideo = () => {
    console.log('Watch Video button clicked'); // Debug log
    console.log('Content:', content); // Debug log

    const youtubeMatch = content.match(
      /https:\/\/www\.youtube\.com\/watch\?v=[\w\d-]+(&t\d*)?/,
    );
    console.log('YouTube match:', youtubeMatch); // Debug log

    if (youtubeMatch) {
      window.open(youtubeMatch[0], '_blank', 'noopener,noreferrer');
      toast.success('Opening video in new tab...');
    } else {
      toast.error('Video link not found');
    }
  };

  const eggInfo = getEasterEggInfo();
  const IconComponent = eggInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={className}
    >
      <Card
        className={`relative overflow-hidden ${eggInfo.bgStyle} ${eggInfo.borderColor} border ${eggInfo.accent} shadow-lg`}
      >
        {/* Subtle animated sparkles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <AnimatePresence>
            {showConfetti && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0"
              >
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={`sparkle-${i}-${Math.random()}`}
                    className="absolute w-1 h-1 bg-primary/30 rounded-full"
                    initial={{
                      x: `${Math.random() * 100}%`,
                      y: '100%',
                      scale: 0,
                      rotate: 0,
                    }}
                    animate={{
                      y: '-20%',
                      scale: [0, 1, 0],
                      rotate: 360,
                    }}
                    transition={{
                      duration: 3 + Math.random() * 2,
                      delay: Math.random() * 0.8,
                      ease: 'easeOut',
                    }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <CardContent className="relative p-6">
          {/* Header with icon and title */}
          <motion.div
            className="flex items-center gap-3 mb-4"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="p-2 rounded-full bg-primary/10 text-primary shadow-sm">
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-foreground">
                {eggInfo.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {eggInfo.subtitle}
              </p>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            className="prose prose-sm max-w-none text-foreground mb-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="whitespace-pre-wrap leading-relaxed">{content}</div>
          </motion.div>

          {/* Action buttons */}
          <motion.div
            className="flex flex-wrap gap-2 pt-4 border-t border-border"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {content.includes('youtube.com') && (
              <Button
                size="sm"
                onClick={handleWatchVideo}
                className="bg-red-600 hover:bg-red-700 text-white border-0"
              >
                <Youtube className="w-4 h-4 mr-2" />
                Watch Video
              </Button>
            )}

            <Button size="sm" variant="outline" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>

            <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
              <Sparkles className="w-3 h-3" />
              Exclusive content
            </div>
          </motion.div>
        </CardContent>

        {/* Subtle glow effect */}
        <motion.div
          className="absolute inset-0 bg-primary/5 rounded-lg pointer-events-none"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            ease: 'easeInOut',
          }}
        />
      </Card>
    </motion.div>
  );
}
