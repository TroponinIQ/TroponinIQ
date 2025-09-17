import { useRef, useEffect, useCallback, useState } from 'react';

type ScrollToBottomOptions = {
  /** Whether to scroll smoothly or instantly */
  behavior?: 'smooth' | 'instant';
  /** Offset from bottom to consider "at bottom" */
  threshold?: number;
  /** Whether to auto-scroll during streaming */
  autoScrollOnStream?: boolean;
  /** Whether to enable mutation observer for real-time DOM tracking */
  enableMutationObserver?: boolean;
  /** Current streaming status - only auto-scroll when actively streaming */
  streamingStatus?: 'streaming' | 'loading' | 'idle';
};

export function useScrollToBottom(options: ScrollToBottomOptions = {}) {
  const {
    behavior = 'smooth',
    threshold = 50,
    autoScrollOnStream = true,
    enableMutationObserver = true,
    streamingStatus = 'idle',
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);
  
  // A ref is used for the most up-to-date value in callbacks,
  // while state is used to trigger re-renders for consumers.
  const userScrolledUpRef = useRef(false);
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  const setUserScrolledUpStateAndRef = (value: boolean) => {
    userScrolledUpRef.current = value;
    setUserScrolledUp(value);
  }
  
  // Animation frame refs for smooth performance
  const animationFrameRef = useRef<number>();
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const lastScrollTopRef = useRef<number>(0);
  const isAutoScrollingRef = useRef(false);
  const mutationObserverRef = useRef<MutationObserver>();

  // Optimized scroll to bottom function
  const scrollToBottom = useCallback((scrollBehavior: 'smooth' | 'instant' = behavior) => {
    const container = containerRef.current;
    if (!container) return;

    setUserScrolledUpStateAndRef(false); // Scrolling to bottom resets user intent
    const targetScrollTop = container.scrollHeight - container.clientHeight;
    
    if (scrollBehavior === 'instant') {
      // Instant scroll - direct manipulation
      isAutoScrollingRef.current = true;
      container.scrollTop = targetScrollTop;
      setIsAtBottom(true);
      // Reset flag after a short delay
      setTimeout(() => {
        isAutoScrollingRef.current = false;
      }, 100);
    } else {
      // Smooth scroll using RAF
      const startScrollTop = container.scrollTop;
      const distance = targetScrollTop - startScrollTop;
      const startTime = performance.now();
      const duration = Math.min(300, Math.abs(distance) * 0.5); // Adaptive duration

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      isAutoScrollingRef.current = true;
      setIsScrolling(true);

      const animateScroll = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        
        container.scrollTop = startScrollTop + (distance * easeOutCubic);
        
        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animateScroll);
        } else {
          setIsScrolling(false);
          setIsAtBottom(true);
          // Reset auto-scrolling flag
          setTimeout(() => {
            isAutoScrollingRef.current = false;
          }, 100);
        }
      };

      animationFrameRef.current = requestAnimationFrame(animateScroll);
    }
  }, [behavior]);

  // Optimized scroll handler with throttling
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container || isAutoScrollingRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const newIsAtBottom = distanceFromBottom <= threshold;
    
    // Detect if user scrolled up manually and update the ref directly
    if (scrollTop < lastScrollTopRef.current && !isAutoScrollingRef.current) {
      setUserScrolledUpStateAndRef(true);
    }
    
    lastScrollTopRef.current = scrollTop;
    
    // Only update state if it changed to prevent unnecessary re-renders
    if (newIsAtBottom !== isAtBottom) {
      setIsAtBottom(newIsAtBottom);
    }

    // Reset user scrolled up flag if they scroll back to the bottom
    if (newIsAtBottom) {
      setUserScrolledUpStateAndRef(false);
    }

    // Clear scroll timeout and set new one
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, [isAtBottom, threshold]);

  // Throttled scroll handler using RAF
  const throttledScrollHandler = useCallback(() => {
    if (animationFrameRef.current) return;
    
    animationFrameRef.current = requestAnimationFrame(() => {
      handleScroll();
      animationFrameRef.current = undefined;
    });
  }, [handleScroll]);

  // Auto-scroll ONLY if the user has not manually scrolled up AND we're actively streaming
  const autoScrollToBottom = useCallback(() => {
    const shouldAutoScroll = autoScrollOnStream && 
      !userScrolledUpRef.current && 
      (streamingStatus === 'streaming' || streamingStatus === 'loading');
      
    if (shouldAutoScroll) {
      scrollToBottom('smooth');
    }
  }, [autoScrollOnStream, scrollToBottom, streamingStatus]);

  // Force scroll to bottom (ignores user scroll state)
  const forceScrollToBottom = useCallback((scrollBehavior: 'smooth' | 'instant' = 'smooth') => {
    setUserScrolledUpStateAndRef(false);
    scrollToBottom(scrollBehavior);
  }, [scrollToBottom]);

  // Mutation observer for real-time DOM changes during streaming only
  useEffect(() => {
    if (!enableMutationObserver) return;
    
    const container = containerRef.current;
    if (!container) return;

    const observer = new MutationObserver(() => {
      // Only auto-scroll during active streaming or loading, not when idle
      if (autoScrollOnStream && 
          !userScrolledUpRef.current && 
          (streamingStatus === 'streaming' || streamingStatus === 'loading')) {
        requestAnimationFrame(() => {
          autoScrollToBottom();
        });
      }
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    mutationObserverRef.current = observer;

    return () => {
      observer.disconnect();
    };
  }, [enableMutationObserver, autoScrollOnStream, autoScrollToBottom, streamingStatus]);

  // Intersection Observer for end element (more efficient)
  useEffect(() => {
    const endElement = endRef.current;
    if (!endElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsAtBottom(true);
          setUserScrolledUpStateAndRef(false);
        }
      },
      {
        root: containerRef.current,
        rootMargin: `0px 0px ${threshold}px 0px`,
        threshold: 0,
      }
    );

    observer.observe(endElement);

    return () => {
      observer.unobserve(endElement);
    };
  }, [threshold]);

  // Attach scroll listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', throttledScrollHandler, { passive: true });

    return () => {
      container.removeEventListener('scroll', throttledScrollHandler);
      
      // Cleanup
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (mutationObserverRef.current) {
        mutationObserverRef.current.disconnect();
      }
    };
  }, [throttledScrollHandler]);

  return {
    containerRef,
    endRef,
    isAtBottom,
    isScrolling,
    userScrolledUp,
    scrollToBottom,
    autoScrollToBottom,
    forceScrollToBottom,
  };
}
