import { useState, useEffect } from 'react';

/**
 * Hook for client-side only date handling
 * Prevents hydration mismatches by ensuring dates are only calculated on the client
 */
export function useClientDate() {
  const [today, setToday] = useState<string>('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Import dateUtils dynamically to avoid SSR issues
    import('@/lib/utils/dateUtils').then(({ getTodayString }) => {
      setToday(getTodayString());
    });
  }, []);

  const getTodayString = () => {
    if (!isClient) return '';
    return today;
  };

  const isToday = (dateString: string) => {
    if (!isClient) return false;
    return dateString === today;
  };

  return {
    today,
    isClient,
    getTodayString,
    isToday
  };
}
