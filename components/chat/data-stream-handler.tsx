'use client';
import { useChat } from '@ai-sdk/react';
import { useEffect, useRef } from 'react';

export type DataStreamDelta = {
  type: string;
  content: unknown;
};

export function DataStreamHandler({ id }: { id: string }) {
  const { data: dataStream } = useChat({ id });
  const lastProcessedIndex = useRef(-1);

  useEffect(() => {
    if (!dataStream) return;

    const newDeltas = dataStream.slice(lastProcessedIndex.current + 1);
    lastProcessedIndex.current = dataStream.length - 1;

    // Removed artifact processing - artifacts system removed
    // This component now serves as a placeholder for future data stream handling

  }, [dataStream]);

  return null;
}
