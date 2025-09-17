'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface InitialLoadingProps {
  children: React.ReactNode;
}

export function InitialLoading({ children }: InitialLoadingProps) {
  const [showInitialLoading, setShowInitialLoading] = useState(true); // Always start with loading
  const [fadeOut, setFadeOut] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isFirstTimeVisitor, setIsFirstTimeVisitor] = useState(true); // Assume first-time until proven otherwise

  // Handle hydration and check visit status
  useEffect(() => {
    setIsHydrated(true);
    
    // Check if user has visited before
    const hasVisited = localStorage.getItem('hasVisitedBefore');
    
    if (hasVisited) {
      // Returning visitor - hide loading almost immediately (just enough to prevent hydration mismatch)
      setIsFirstTimeVisitor(false);
      setTimeout(() => {
        setShowInitialLoading(false);
      }, 10); // Minimal delay - just enough to prevent hydration issues
    } else {
      // First-time visitor - show full loading experience
      setIsFirstTimeVisitor(true);
      localStorage.setItem('hasVisitedBefore', 'true');
      
      // Show loading for 2.5 seconds, then fade out
      const timer = setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => {
          setShowInitialLoading(false);
        }, 600);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, []);

  // Show loading screen (consistent for SSR and initial client render)
  if (showInitialLoading) {
    return (
      <div className={`relative flex items-center justify-center min-h-screen overflow-hidden transition-opacity duration-500 ease-out ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
        {/* Clean solid black background */}
        <div className="absolute inset-0 z-0 bg-black" />

        {/* Content */}
        <div className={`relative z-10 text-center space-y-16 px-4 ${isHydrated && isFirstTimeVisitor ? 'animate-fade-in' : ''}`}>
          {/* Logo with gentle entrance */}
          <div className={`flex justify-center ${isHydrated && isFirstTimeVisitor ? 'animate-logo-entrance' : ''}`}>
            <div className="relative logo-container">
              <Image
                src="/logo_full_name.png"
                alt="TroponinIQ Logo"
                width={320}
                height={120}
                className="transition-opacity duration-700"
                priority
              />
            </div>
          </div>

          {/* Message */}
          <div className={`${isHydrated && isFirstTimeVisitor ? 'animate-text-entrance' : ''}`} style={{ animationDelay: isFirstTimeVisitor ? '0.6s' : '0s' }}>
            <p className="text-gray-200 text-xl font-light tracking-wide max-w-md mx-auto">
              What would you like to learn today?
            </p>
          </div>

          {/* Simple elegant indicator */}
          <div className={`flex justify-center ${isHydrated && isFirstTimeVisitor ? 'animate-indicator-entrance' : ''}`} style={{ animationDelay: isFirstTimeVisitor ? '1s' : '0s' }}>
            <div className="flex space-x-2">
              <div className={`size-2 bg-gray-400/50 rounded-full ${isFirstTimeVisitor ? 'animate-pulse-gentle' : 'animate-pulse'}`} />
              <div className={`size-2 bg-gray-400/50 rounded-full ${isFirstTimeVisitor ? 'animate-pulse-gentle' : 'animate-pulse'}`} style={{ animationDelay: isFirstTimeVisitor ? '0.5s' : '0s' }} />
              <div className={`size-2 bg-gray-400/50 rounded-full ${isFirstTimeVisitor ? 'animate-pulse-gentle' : 'animate-pulse'}`} style={{ animationDelay: isFirstTimeVisitor ? '1s' : '0s' }} />
            </div>
          </div>
        </div>

        <style jsx>{`
          /* Entrance Animations - Smooth and Elegant */
          .animate-fade-in {
            animation: fade-in 1s ease-out;
          }

          .animate-logo-entrance {
            animation: logo-entrance 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            animation-fill-mode: both;
          }

          .animate-text-entrance {
            animation: text-entrance 0.8s ease-out;
            animation-fill-mode: both;
          }

          .animate-indicator-entrance {
            animation: indicator-entrance 0.6s ease-out;
            animation-fill-mode: both;
          }

          /* Pulse Animation - Gentle and Rhythmic */
          .animate-pulse-gentle {
            animation: pulse-gentle 2s ease-in-out infinite;
          }

          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes logo-entrance {
            from { 
              opacity: 0; 
              transform: translateY(20px) scale(0.95); 
            }
            to { 
              opacity: 1; 
              transform: translateY(0) scale(1); 
            }
          }

          @keyframes text-entrance {
            from { 
              opacity: 0; 
              transform: translateY(15px); 
            }
            to { 
              opacity: 1; 
              transform: translateY(0); 
            }
          }

          @keyframes indicator-entrance {
            from { 
              opacity: 0; 
              transform: scale(0.8); 
            }
            to { 
              opacity: 1; 
              transform: scale(1); 
            }
          }

          @keyframes pulse-gentle {
            0%, 100% { 
              opacity: 0.3; 
              transform: scale(1); 
            }
            50% { 
              opacity: 0.7; 
              transform: scale(1.1); 
            }
          }
        `}</style>
      </div>
    );
  }

  // Show children content
  return <>{children}</>;
} 