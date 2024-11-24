import { useEffect, useRef, useState } from 'react';

interface UseInfiniteScrollProps<T> {
  items: T[];
  initialPageSize?: number;
  loadMoreThreshold?: number;
}

export function useInfiniteScroll<T>({
  items,
  initialPageSize = 12,
  loadMoreThreshold = 200,
}: UseInfiniteScrollProps<T>) {
  const [displayedItems, setDisplayedItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 初始化显示的项目
  useEffect(() => {
    setDisplayedItems(items.slice(0, initialPageSize));
    setHasMore(items.length > initialPageSize);
    setPage(1);
  }, [items, initialPageSize]);

  // 处理滚动加载
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      {
        rootMargin: `0px 0px ${loadMoreThreshold}px 0px`,
      }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMoreThreshold]);

  // 加载更多项目
  const loadMore = () => {
    setIsLoading(true);
    const start = 0;
    const end = (page + 1) * initialPageSize;
    const newItems = items.slice(start, end);

    setTimeout(() => {
      setDisplayedItems(newItems);
      setPage(prev => prev + 1);
      setHasMore(end < items.length);
      setIsLoading(false);
    }, 300);
  };

  return {
    displayedItems,
    hasMore,
    isLoading,
    loadMoreRef,
  };
}
