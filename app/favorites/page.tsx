'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Search } from 'lucide-react';
import Layout from '@/components/Layout';
import ResourceCard from '@/components/ResourceCard';
import ResourceSkeleton from '@/components/ResourceSkeleton';
import PullToRefresh from '@/components/PullToRefresh';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

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
  const fetchFavorites = useCallback(async () => {
    try {
      const response = await fetch('/api/resources?favorite=true');
      if (!response.ok) throw new Error('Failed to fetch favorites');
      const data = await response.json();
      setResources(data.resources);
      setFilteredResources(data.resources);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast.error('加载收藏失败');
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchFavorites();
    }
  }, [fetchFavorites, session]);

  // 过滤资源
  useEffect(() => {
    if (!resources) {
      setFilteredResources([]);
      return;
    }

    let filtered = [...resources];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(resource =>
        resource.title.toLowerCase().includes(term) ||
        resource.description?.toLowerCase().includes(term)
      );
    }

    setFilteredResources(filtered);
  }, [resources, searchTerm]);

  // 切换收藏状态
  const handleToggleFavorite = async (resourceId: string) => {
    const resource = resources.find(r => r.id === resourceId);
    if (!resource) return;

    try {
      const response = await fetch(`/api/resources/${resourceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favorite: !resource.isFavorite }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '操作失败');
      }

      // 从列表中移除
      setResources(prevResources =>
        prevResources.filter(r => r.id !== resourceId)
      );
      setFilteredResources(prevResources =>
        prevResources.filter(r => r.id !== resourceId)
      );

      toast.success('已取消收藏');
    } catch (error) {
      console.error('Toggle favorite failed:', error);
      toast.error(error instanceof Error ? error.message : '操作失败');
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

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-background to-secondary/20">
        <PullToRefresh onRefresh={fetchFavorites}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
            <div className="text-center space-y-6">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary/80 to-primary bg-clip-text text-transparent animate-gradient">
                我的收藏
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                管理您收藏的资源
              </p>
            </div>

            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  placeholder="搜索收藏..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 transition-shadow duration-200 border-muted/50 hover:border-primary/50 focus:border-primary shadow-sm hover:shadow-md focus:shadow-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isInitialLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <ResourceSkeleton key={index} />
                ))
              ) : displayedItems.length > 0 ? (
                displayedItems.map((resource) => (
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
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-lg text-muted-foreground">暂无收藏</p>
                </div>
              )}
            </div>

            {hasMore && !isInitialLoading && (
              <div
                ref={loadMoreRef}
                className="flex justify-center py-8"
              >
                <Button
                  variant="outline"
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? '加载中...' : '加载更多'}
                </Button>
              </div>
            )}
          </div>
        </PullToRefresh>
      </div>
    </Layout>
  );
}