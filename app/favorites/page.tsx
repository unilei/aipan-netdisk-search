'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import Layout from '@/components/Layout';
import ResourceCard from '@/components/ResourceCard';
import ResourceSkeleton from '@/components/ResourceSkeleton';
import PullToRefresh from '@/components/PullToRefresh';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';

interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  size?: string | null;
  categories: { id: string; name: string; }[];
  tags: { id: string; name: string; }[];
  links: { id: string; url: string; platform: string; }[];
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function FavoritesPage() {
  const { data: session } = useSession();
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // 获取收藏的资源
  const fetchResources = useCallback(async () => {
    if (!session) {
      setIsInitialLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/resources?favorite=true');
      if (!response.ok) throw new Error('Failed to fetch resources');
      const data = await response.json();
      setResources(data.resources);
    } catch (error) {
      toast.error('加载资源失败');
    } finally {
      setIsInitialLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  // 过滤资源
  useEffect(() => {
    let filtered = resources;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(resource =>
        resource.title.toLowerCase().includes(term) ||
        resource.description.toLowerCase().includes(term)
      );
    }

    setFilteredResources(filtered);
  }, [resources, searchTerm]);

  // 切换收藏状态
  const handleToggleFavorite = async (resourceId: string) => {
    if (!session) {
      toast.error('请先登录');
      return;
    }

    // 乐观更新 - 在收藏页面，取消收藏就是从列表中移除
    setResources(prevResources =>
      prevResources.filter(resource => resource.id !== resourceId)
    );

    try {
      const response = await fetch(`/api/resources/${resourceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        // 如果请求失败，重新获取资源列表
        await fetchResources();
        throw new Error(result.error || '操作失败');
      }

      // 通知其他组件状态已更新
      window.dispatchEvent(new CustomEvent('favoriteChanged', {
        detail: { resourceId, isFavorite: false }
      }));

      toast.success(result.message);
    } catch (error) {
      console.error('更新收藏状态失败:', error);
      toast.error(error instanceof Error ? error.message : '操作失败，请稍后重试');
    }
  };

  // 无限滚动
  const {
    displayedItems,
    hasMore,
    isLoading: isLoadingMore,
    loadMoreRef,
  } = useInfiniteScroll({
    items: filteredResources,
    initialPageSize: 12,
  });

  // 下拉刷新
  const {
    pullDistance,
    isRefreshing,
  } = usePullToRefresh({
    onRefresh: fetchResources,
    threshold: 80,
  });

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-background to-secondary/20">
        <PullToRefresh
          pullDistance={pullDistance}
          isRefreshing={isRefreshing}
          threshold={80}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
          <div className="text-center space-y-6">
            <h1 className="text-4xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary/80 to-primary bg-clip-text text-transparent animate-gradient">
              我的收藏
            </h1>
          </div>

          {!session ? (
            <div className="max-w-md mx-auto text-center space-y-4 p-8 border rounded-lg bg-card">
              <h2 className="text-xl font-semibold">请先登录</h2>
              <p className="text-muted-foreground">
                登录后即可查看和管理您收藏的资源
              </p>
              <Button
                variant="default"
                size="lg"
                onClick={() => window.location.href = '/api/auth/signin'}
                className="mt-4"
              >
                立即登录
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 max-w-3xl mx-auto">
                <div className="flex-1 relative group">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input
                    placeholder="搜索收藏..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 transition-shadow duration-200 border-muted/50 hover:border-primary/50 focus:border-primary shadow-sm hover:shadow-md focus:shadow-lg"
                  />
                </div>
              </div>

              {isInitialLoading ? (
                <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in-0 duration-500">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <ResourceSkeleton key={i} />
                  ))}
                </div>
              ) : filteredResources.length === 0 ? (
                <div className="max-w-md mx-auto">
                  <div className="bg-card border border-dashed rounded-lg p-8 text-center animate-in fade-in-0 zoom-in-95 duration-500">
                    <div className="w-12 h-12 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
                      <Search className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="mt-4 text-xl font-semibold">
                      {searchTerm ? '未找到相关收藏' : '还没有收藏任何资源'}
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                      {searchTerm ? '请尝试其他搜索条件' : '浏览资源并点击收藏按钮来添加收藏'}
                    </p>
                    {searchTerm && (
                      <Button
                        variant="outline"
                        onClick={() => setSearchTerm('')}
                        className="mt-6 hover:border-primary/50 transition-colors"
                      >
                        查看全部收藏
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in-0 duration-500">
                    {displayedItems.map((resource, index) => (
                      <div
                        key={resource.id}
                        className="animate-in fade-in-0 slide-in-from-bottom-3"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <ResourceCard
                          key={resource.id}
                          id={resource.id}
                          title={resource.title}
                          description={resource.description}
                          url={resource.url}
                          size={resource.size ?? undefined}
                          categories={resource.categories.map(c => c.name)}
                          tags={resource.tags.map(t => t.name)}
                          links={resource.links}
                          isFavorite={resource.isFavorite}
                          onToggleFavorite={() => handleToggleFavorite(resource.id)}
                        />
                      </div>
                    ))}
                  </div>

                  {hasMore && (
                    <div ref={loadMoreRef} className="py-12 text-center">
                      {isLoadingMore ? (
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary/30 border-r-primary align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                      ) : (
                        <p className="text-muted-foreground animate-bounce">
                          向下滚动加载更多
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              {filteredResources.length > 0 && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50">
                    共 {filteredResources.length} 个收藏
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}