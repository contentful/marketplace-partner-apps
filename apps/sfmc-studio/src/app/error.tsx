'use client';
import GlobalErrorBoundary from '@/components/ErrorBoundary/GlobalErrorBoundary';
import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error('Error caught at EB:', error);
  }, [error]);

  return <GlobalErrorBoundary reset={reset} />;
}
