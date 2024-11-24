'use client';

import React, { useState, useEffect, useCallback } from 'react';
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

export default function CategoriesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // 获取所有资源
  const fetchResources = useCallback(async () => {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      
      // 提取所有资源并扁平化
      const allResources = data.flatMap((category: any) => 
        category.resources.map((resource: Resource) => ({
          ...resource,
          isFavorite: resource.isFavorite,
        }))
      );
      
      setResources(allResources);
      
      // 收集所有分类
      const allCategories = new Set<string>();
      data.forEach((category: any) => {
        if (category.resources.length > 0) {
          allCategories.add(category.name);
        }
      });
      
      setCategories(Array.from(allCategories));
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast.error('加载资源失败');
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  // 过滤资源
  useEffect(() => {
    if (!resources) {
      setFilteredResources([]);
      return;
    }

    let filtered = [...resources];

    if (selectedCategory) {
      filtered = filtered.filter(resource =>
        resource.categories?.some(cat => cat.name === selectedCategory)
      );
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(resource =>
        resource.title.toLowerCase().includes(term) ||
        resource.description?.toLowerCase().includes(term)
      );
    }

    setFilteredResources(filtered);
  }, [resources, selectedCategory, searchTerm]);

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

      const { isFavorite } = await response.json();
      
      // 更新资源的收藏状态
      setResources(prevResources =>
        prevResources.map(r =>
          r.id === resourceId ? { ...r, isFavorite } : r
        )
      );

      // 同时更新过滤后的资源列表
      setFilteredResources(prevResources =>
        prevResources.map(r =>
          r.id === resourceId ? { ...r, isFavorite } : r
        )
      );

      toast.success(isFavorite ? '已添加到收藏' : '已取消收藏');
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
        <PullToRefresh onRefresh={fetchResources}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
            <div className="text-center space-y-6">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary/80 to-primary bg-clip-text text-transparent animate-gradient">
                分类浏览
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                探索不同类别的优质资源
              </p>
            </div>

            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  placeholder="搜索资源..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 transition-shadow duration-200 border-muted/50 hover:border-primary/50 focus:border-primary shadow-sm hover:shadow-md focus:shadow-lg"
                />
              </div>

              <div className="bg-card shadow-sm rounded-lg p-4 space-y-3">
                <h2 className="font-medium text-lg text-card-foreground">分类</h2>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedCategory === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
                    className="transition-all duration-200"
                  >
                    全部
                  </Button>
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className="transition-all duration-200"
                    >
                      {category}
                    </Button>
                  ))}
                </div>
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
                  <p className="text-lg text-muted-foreground">暂无资源</p>
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