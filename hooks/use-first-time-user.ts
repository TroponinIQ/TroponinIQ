'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/utils';

export function useFirstTimeUser() {
  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null);
  
  const { data: historyData } = useSWR('/api/chat/history?limit=1', fetcher);
  
  useEffect(() => {
    if (historyData) {
      // User is first-time if they have no chats at all
      const hasNoChats = !historyData.chats || historyData.chats.length === 0;
      setIsFirstTime(hasNoChats);
    }
  }, [historyData]);
  
  return isFirstTime;
} 