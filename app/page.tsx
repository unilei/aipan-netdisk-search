'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Grid2X2, Search, SlidersHorizontal } from 'lucide-react';
import Layout from '@/components/Layout';
import ResourceCard from '@/components/ResourceCard';
import ResourceSkeleton from '@/components/ResourceSkeleton';
import PullToRefresh from '@/components/PullToRefresh';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from 'sonner';
import { Suspense } from 'react';

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

interface Metadata {
  id: string;
  name: string;
  count: number;
}

function HomeContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [categories, setCategories] = useState<Metadata[]>([]);
  const [tags, setTags] = useState<Metadata[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalResources, setTotalResources] = useState(0);
  const [cursor, setCursor] = useState<string | null>(null);

  // 从 URL 参数中获取初始筛选条件
  useEffect(() => {
    const category = searchParams?.get('category');
    const tag = searchParams?.get('tag');

    if (category) {
      setSelectedCategories([decodeURIComponent(category)]);
    }

    if (tag) {
      setSelectedTags([decodeURIComponent(tag)]);
    }
  }, [searchParams]);

  // 获取所有分类和标签
  const fetchMetadata = useCallback(async () => {
    try {
      const response = await fetch('/api/metadata');
      if (!response.ok) throw new Error('Failed to fetch metadata');
      const data = await response.json();
      setCategories(data.categories);
      setTags(data.tags);
    } catch (error) {
      toast.error('加载分类和标签失败');
    }
  }, []);

  // 初始化加载
  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  // 获取资源
  const fetchResources = useCallback(async (isAppend: boolean = false) => {
    if (!isAppend) {
      setIsInitialLoading(true);
    }
    setIsLoadingMore(true);

    try {
      const params = new URLSearchParams();
      params.set('limit', '10');

      if (cursor && isAppend) {
        params.set('cursor', cursor);
      }

      if (searchTerm) {
        params.set('search', searchTerm);
      }
      
      if (selectedCategories.length > 0) {
        params.set('categories', selectedCategories.join(','));
      }
      
      if (selectedTags.length > 0) {
        params.set('tags', selectedTags.join(','));
      }

      console.log(`Fetching resources with params:`, params.toString());
      const response = await fetch(`/api/resources?${params.toString()}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch resources:', errorText);
        throw new Error(`Failed to fetch resources: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Received data:', data);
      
      if (isAppend) {
        setResources(prev => {
          const existingIds = new Set(prev.map(r => r.id));
          const newResources = data.resources.filter((r: { id: string; }) => !existingIds.has(r.id));
          console.log(`Adding ${newResources.length} new resources`);
          return [...prev, ...newResources];
        });
      } else {
        console.log(`Setting initial ${data.resources.length} resources`);
        setResources(data.resources);
      }
      
      setHasMore(!!data.nextCursor);
      setCursor(data.nextCursor);
      setTotalResources(data.total);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast.error(isAppend ? '加载更多资源失败' : '加载资源失败');
      if (isAppend) {
        // 如果是加载更多失败，重置加载状态，允许重试
        setHasMore(true);
      }
    } finally {
      setIsLoadingMore(false);
      setIsInitialLoading(false);
    }
  }, [searchTerm, selectedCategories, selectedTags, cursor]);

  useEffect(() => {
    setResources([]);
    setCursor(null);
    setHasMore(true);
    const debounceTimer = setTimeout(() => {
      fetchResources(false);
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, selectedCategories, selectedTags]);

  // 搜索处理
  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  // 监听滚动
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    let isLoading = false;

    const handleScroll = () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }

      scrollTimeout = setTimeout(async () => {
        if (isLoading || !hasMore || isLoadingMore) {
          console.log('Skipping load more:', { isLoading, hasMore, isLoadingMore });
          return;
        }

        const scrollHeight = document.documentElement.scrollHeight;
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const clientHeight = document.documentElement.clientHeight;

        // 当距离底部还有 20% 的距离时加载更多
        if (scrollTop + clientHeight >= scrollHeight * 0.8) {
          console.log('Loading more resources...');
          isLoading = true;
          try {
            await fetchResources(true);
          } finally {
            isLoading = false;
          }
        }
      }, 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [fetchResources, hasMore, isLoadingMore]);

  // 切换收藏状态
  const handleToggleFavorite = async (resourceId: string) => {
    if (!session) {
      toast.error('请先登录');
      return;
    }

    // 找到当前资源的收藏状态
    const resource = resources.find(r => r.id === resourceId);
    if (!resource) return;

    try {
      const response = await fetch(`/api/resources/${resourceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          favorite: !resource.isFavorite
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '操作失败');
      }

      // 更新资源状态为服务器返回的状态
      setResources(prevResources =>
        prevResources.map(resource =>
          resource.id === resourceId
            ? { ...resource, isFavorite: result.isFavorite }
            : resource
        )
      );

      // 通知其他组件状态已更新
      window.dispatchEvent(new CustomEvent('favoriteChanged', {
        detail: { resourceId, isFavorite: result.isFavorite }
      }));

      toast.success(result.message);
    } catch (error) {
      console.error('更新收藏状态失败:', error);
      toast.error(error instanceof Error ? error.message : '操作失败，请稍后重试');
    }
  };

  // 切换分类
  const toggleCategory = useCallback((category: string) => {
    setSelectedCategories(prev => {
      const newCategories = prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category];
      return newCategories;
    });
  }, []);

  // 切换标签
  const toggleTag = useCallback((tag: string) => {
    setSelectedTags(prev => {
      const newTags = prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag];
      return newTags;
    });
  }, []);

  // 清除筛选
  const clearFilters = useCallback(() => {
    setSelectedCategories([]);
    setSelectedTags([]);
  }, []);

  const fetchData = async () => {
    await fetchResources(false);
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-background to-secondary/20">
        <PullToRefresh onRefresh={async () => {
          await fetchData();
        }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
            <div className="text-center space-y-6">
              <h1 className="text-4xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary/80 to-primary bg-clip-text text-transparent animate-gradient">
                爱盼短剧
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                海量短剧资源，随心观看
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 max-w-3xl mx-auto">
              <div className="flex-1 relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  placeholder="搜索资源..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 h-12 transition-shadow duration-200 border-muted/50 hover:border-primary/50 focus:border-primary shadow-sm hover:shadow-md focus:shadow-lg"
                />
              </div>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="lg" className="flex items-center gap-2 h-12 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <SlidersHorizontal className="h-4 w-4" />
                    <span>筛选</span>
                    {(selectedCategories.length > 0 || selectedTags.length > 0) && (
                      <span className="ml-1 text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5 animate-in slide-in-from-right-5">
                        {selectedCategories.length + selectedTags.length}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="h-full flex flex-col">
                  <SheetHeader className="border-b pb-4 flex-none">
                    <SheetTitle>筛选条件</SheetTitle>
                  </SheetHeader>
                  <div className="flex-1 overflow-y-auto">
                    <div className="py-6 space-y-8">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between sticky top-0 bg-background py-2">
                          <h3 className="font-medium text-lg">分类</h3>
                          {selectedCategories.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedCategories([])}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              清除
                            </Button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {categories.sort((a, b) => a.name.localeCompare(b.name)).map(category => (
                            <Button
                              key={category.id}
                              variant={selectedCategories.includes(category.name) ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleCategory(category.name)}
                              className={`transition-all duration-200 ${
                                selectedCategories.includes(category.name)
                                  ? "shadow-md hover:shadow-lg"
                                  : "hover:border-primary/50"
                              }`}
                            >
                              {category.name}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between sticky top-0 bg-background py-2">
                          <h3 className="font-medium text-lg">标签</h3>
                          {selectedTags.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedTags([])}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              清除
                            </Button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {tags.sort((a, b) => a.name.localeCompare(b.name)).map(tag => (
                            <Button
                              key={tag.id}
                              variant={selectedTags.includes(tag.name) ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleTag(tag.name)}
                              className={`transition-all duration-200 ${
                                selectedTags.includes(tag.name)
                                  ? "shadow-md hover:shadow-lg"
                                  : "hover:border-primary/50"
                              }`}
                            >
                              #{tag.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {(selectedCategories.length > 0 || selectedTags.length > 0) && (
                    <div className="flex-none border-t p-4 bg-background">
                      <Button
                        variant="outline"
                        className="w-full hover:border-destructive/50 hover:text-destructive transition-colors"
                        onClick={clearFilters}
                      >
                        清除所有筛选
                      </Button>
                    </div>
                  )}
                </SheetContent>
              </Sheet>
            </div>

            {isInitialLoading ? (
              <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in-0 duration-500">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ResourceSkeleton key={i} />
                ))}
              </div>
            ) : resources.length === 0 ? (
              <Card className="p-8 text-center max-w-md mx-auto border-dashed animate-in fade-in-0 zoom-in-95 duration-500">
                <Grid2X2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <h2 className="mt-4 text-xl font-semibold">未找到相关资源</h2>
                <p className="mt-2 text-muted-foreground">
                  {searchTerm || selectedCategories.length > 0 || selectedTags.length > 0
                    ? '请尝试调整筛选条件'
                    : '还没有添加任何资源'}
                </p>
                {(searchTerm || selectedCategories.length > 0 || selectedTags.length > 0) && (
                  <Button
                    variant="outline"
                    className="mt-6 hover:border-destructive/50 hover:text-destructive transition-colors"
                    onClick={clearFilters}
                  >
                    清除所有筛选
                  </Button>
                )}
              </Card>
            ) : (
              <>
                <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in-0 duration-500">
                  {resources.map((resource, index) => (
                    <div
                      key={resource.id}
                      className="animate-in fade-in-0 slide-in-from-bottom-3"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <ResourceCard
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
                  <div className="py-12 text-center">
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

            {resources.length > 0 && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50">
                  共 {totalResources} 个资源
                </p>
              </div>
            )}
          </div>
        </PullToRefresh>
      </div>
    </Layout>
  );
}

export default function HomePage() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
