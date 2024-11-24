import { useEffect, useState } from 'react';

interface UsePullToRefreshProps {
  onRefresh: () => Promise<void>;
  threshold?: number;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
}: UsePullToRefreshProps) {
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let touchStartY = 0;
    let touchMoveY = 0;
    let isScrolledToTop = false;

    const handleTouchStart = (e: TouchEvent) => {
      isScrolledToTop = window.scrollY <= 0;
      if (!isScrolledToTop || isRefreshing) return;

      touchStartY = e.touches[0].clientY;
      setStartY(touchStartY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isScrolledToTop || isRefreshing) return;

      touchMoveY = e.touches[0].clientY;
      const distance = Math.max(0, touchMoveY - touchStartY);
      
      if (distance > 0) {
        e.preventDefault();
        setPullDistance(distance);
      }
    };

    const handleTouchEnd = async () => {
      if (!isScrolledToTop || isRefreshing) return;

      if (pullDistance >= threshold) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }
      setPullDistance(0);
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onRefresh, threshold, isRefreshing, pullDistance]);

  return {
    pullDistance,
    isRefreshing,
  };
}
