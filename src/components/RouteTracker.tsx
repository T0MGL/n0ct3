import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/lib/meta-pixel';

export const RouteTracker = (): null => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    trackPageView();
  }, [pathname, search]);

  return null;
};
