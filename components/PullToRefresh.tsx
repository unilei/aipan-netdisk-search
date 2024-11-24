'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ArrowDown } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
}

export default function PullToRefresh({
  onRefresh,
  children,
  threshold = 100,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (startY === 0 || window.scrollY > 0) return;

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY);
    setPullDistance(distance);
  }, [startY]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance > threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
    setStartY(0);
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(pullDistance / threshold, 1);
  const opacity = Math.min(progress, 0.8);
  const scale = 0.8 + (progress * 0.2);
  const rotation = progress * 180;

  return (
    <div
      style={{
        transform: `translateY(${pullDistance}px)`,
        transition: isRefreshing || pullDistance === 0 ? 'transform 0.2s ease-out' : 'none',
      }}
    >
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="fixed left-0 right-0 flex justify-center pointer-events-none"
          style={{
            top: Math.min(pullDistance / 2, 100),
            transform: `translateY(-50%)`,
            transition: isRefreshing ? 'all 0.2s ease-out' : 'none',
          }}
        >
          <div
            className="bg-background/80 backdrop-blur-sm rounded-full p-3 shadow-lg"
            style={{
              opacity,
              transform: `scale(${scale})`,
            }}
          >
            {isRefreshing ? (
              <div className="animate-spin">
                <ArrowDown className="h-6 w-6" />
              </div>
            ) : (
              <ArrowDown
                className="h-6 w-6"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: 'transform 0.1s ease-out',
                }}
              />
            )}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
