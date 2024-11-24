import React from 'react';
import { ArrowDown } from 'lucide-react';

interface PullToRefreshProps {
  pullDistance: number;
  isRefreshing: boolean;
  threshold: number;
}

export default function PullToRefresh({
  pullDistance,
  isRefreshing,
  threshold,
}: PullToRefreshProps) {
  const progress = Math.min(pullDistance / threshold, 1);
  const opacity = Math.min(progress, 0.8);
  const scale = 0.8 + (progress * 0.2);
  const rotation = progress * 180;

  if (pullDistance === 0 && !isRefreshing) return null;

  return (
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
  );
}
