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

export default function HomeContent() {
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

      if (cursor) {
        params.set('cursor', cursor);
      }

      if (selectedCategories.length > 0) {
        params.set('categories', selectedCategories.join(','));
      }

      if (selectedTags.length > 0) {
        params.set('tags', selectedTags.join(','));
      }

      if (searchTerm) {
        params.set('search', searchTerm);
      }

      const response = await fetch(`/api/resources?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch resources');
      const data = await response.json();

      setResources(prev => isAppend ? [...prev, ...data.resources] : data.resources);
      setFilteredResources(prev => isAppend ? [...prev, ...data.resources] : data.resources);
      setTotalResources(data.total);
      setHasMore(data.hasMore);
      setCursor(data.nextCursor);
    } catch (error) {
      toast.error('加载资源失败');
    } finally {
      setIsInitialLoading(false);
      setIsLoadingMore(false);
    }
  }, [cursor, selectedCategories, selectedTags, searchTerm]);

  // 初始化加载和筛选条件变化时重新加载
  useEffect(() => {
    setCursor(null);
    fetchResources();
  }, [fetchResources, selectedCategories, selectedTags]);

  // 搜索处理
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setCursor(null);
    fetchResources();
  }, [fetchResources]);

  // 加载更多
  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      fetchResources(true);
    }
  }, [fetchResources, isLoadingMore, hasMore]);

  // 切换分类
  const toggleCategory = useCallback((categoryName: string) => {
    setSelectedCategories(prev => {
      const isSelected = prev.includes(categoryName);
      return isSelected
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName];
    });
  }, []);

  // 切换标签
  const toggleTag = useCallback((tagName: string) => {
    setSelectedTags(prev => {
      const isSelected = prev.includes(tagName);
      return isSelected
        ? prev.filter(t => t !== tagName)
        : [...prev, tagName];
    });
  }, []);

  // 清除筛选
  const clearFilters = useCallback(() => {
    setSelectedCategories([]);
    setSelectedTags([]);
    setSearchTerm('');
  }, []);

  // 下拉刷新
  const handleRefresh = useCallback(async () => {
    setCursor(null);
    await fetchResources();
  }, [fetchResources]);

  // 收藏/取消收藏
  const toggleFavorite = useCallback(async (resourceId: string) => {
    if (!session) {
      toast.error('请先登录');
      return;
    }

    try {
      const resource = resources.find(r => r.id === resourceId);
      if (!resource) return;

      const response = await fetch(`/api/resources/${resourceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isFavorite: !resource.isFavorite,
        }),
      });

      if (!response.ok) throw new Error('Failed to toggle favorite');

      setResources(prev =>
        prev.map(r =>
          r.id === resourceId
            ? { ...r, isFavorite: !r.isFavorite }
            : r
        )
      );

      setFilteredResources(prev =>
        prev.map(r =>
          r.id === resourceId
            ? { ...r, isFavorite: !r.isFavorite }
            : r
        )
      );

      toast.success(resource.isFavorite ? '已取消收藏' : '已加入收藏');
    } catch (error) {
      toast.error('操作失败');
    }
  }, [resources, session]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* 搜索框 */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="search"
                placeholder="搜索资源..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </form>

          {/* 筛选按钮 */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2">
                <SlidersHorizontal size={20} />
                筛选
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>筛选条件</SheetTitle>
              </SheetHeader>
              <div className="py-4">
                <div className="mb-4">
                  <h3 className="text-lg font-medium mb-2">分类</h3>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <Button
                        key={category.id}
                        variant={selectedCategories.includes(category.name) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleCategory(category.name)}
                      >
                        {category.name} ({category.count})
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <h3 className="text-lg font-medium mb-2">标签</h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Button
                        key={tag.id}
                        variant={selectedTags.includes(tag.name) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleTag(tag.name)}
                      >
                        {tag.name} ({tag.count})
                      </Button>
                    ))}
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={clearFilters}
                >
                  清除筛选
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* 布局切换按钮 */}
          <Button variant="outline" className="gap-2">
            <Grid2X2 size={20} />
            网格
          </Button>
        </div>

        {/* 筛选标签展示 */}
        {(selectedCategories.length > 0 || selectedTags.length > 0) && (
          <div className="flex flex-wrap gap-2 mb-6">
            {selectedCategories.map((category) => (
              <Button
                key={category}
                variant="secondary"
                size="sm"
                onClick={() => toggleCategory(category)}
                className="gap-2"
              >
                {category} ×
              </Button>
            ))}
            {selectedTags.map((tag) => (
              <Button
                key={tag}
                variant="secondary"
                size="sm"
                onClick={() => toggleTag(tag)}
                className="gap-2"
              >
                {tag} ×
              </Button>
            ))}
          </div>
        )}

        {/* 资源列表 */}
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isInitialLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <ResourceSkeleton key={index} />
              ))
            ) : filteredResources.length > 0 ? (
              filteredResources.map((resource) => (
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
                  onToggleFavorite={() => toggleFavorite(resource.id)}
                />
              ))
            ) : (
              <Card className="col-span-full p-8 text-center">
                <p className="text-gray-500">暂无资源</p>
              </Card>
            )}
          </div>
        </PullToRefresh>

        {/* 加载更多 */}
        {!isInitialLoading && hasMore && (
          <div className="text-center mt-8">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? '加载中...' : '加载更多'}
            </Button>
          </div>
        )}

        {/* 总数显示 */}
        <div className="text-center text-gray-500 mt-4">
          共 {totalResources} 个资源
        </div>
      </div>
    </Layout>
  );
}
