'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Search, ExternalLink, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResourceDialog } from '@/components/ResourceDialog';
import { DeleteDialog } from '@/components/DeleteDialog';
import { toast } from 'sonner';

interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  size?: string;
  isFavorite: boolean;
  categories: { name: string }[];
  tags: { name: string }[];
  links: { url: string; platform: string }[];
  creator: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

interface PageState {
  resources: Resource[];
  searchTerm: string;
  isLoading: boolean;
  selectedResource: Resource | null;
  isDialogOpen: boolean;
  isDeleteDialogOpen: boolean;
  cursor: string | null;
  hasMore: boolean;
  total: number;
}

export default function ResourcesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [state, setState] = useState<PageState>({
    resources: [],
    searchTerm: '',
    isLoading: true,
    selectedResource: null,
    isDialogOpen: false,
    isDeleteDialogOpen: false,
    cursor: null,
    hasMore: true,
    total: 0,
  });

  // 检查管理员权限
  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && session?.user?.role !== 'admin')) {
      router.push('/login');
    }
  }, [session, status, router]);

  // 获取所有资源
  const fetchResources = async (cursor?: string | null) => {
    try {
      setState((prevState) => ({ ...prevState, isLoading: true }));
      const params = new URLSearchParams();
      if (cursor) params.set('cursor', cursor);
      if (state.searchTerm) params.set('search', state.searchTerm);
      params.set('take', '10');
      
      const response = await fetch(`/api/resources?${params.toString()}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '加载资源失败');
      }
      const { resources, nextCursor, total } = await response.json();
      if (!Array.isArray(resources)) {
        throw new Error('返回的资源数据格式不正确');
      }

      setState((prevState) => ({
        ...prevState,
        resources: cursor ? [...prevState.resources, ...resources] : resources,
        cursor: nextCursor,
        hasMore: !!nextCursor,
        total,
      }));
    } catch (error) {
      console.error('加载资源失败:', error);
      toast.error(error instanceof Error ? error.message : '加载资源失败');
      setState((prevState) => ({
        ...prevState,
        resources: [],
        cursor: null,
        hasMore: false,
      }));
    } finally {
      setState((prevState) => ({ ...prevState, isLoading: false }));
    }
  };

  // 搜索时重置分页
  const handleSearch = (value: string) => {
    setState((prevState) => ({
      ...prevState,
      searchTerm: value,
      resources: [],
      cursor: null,
      hasMore: true,
    }));
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchResources();
    }
  }, [status, session]);

  // 添加搜索效果
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      const debounceTimer = setTimeout(() => {
        fetchResources();
      }, 300);

      return () => clearTimeout(debounceTimer);
    }
  }, [state.searchTerm, status, session]);

  // 移除客户端过滤，使用服务端搜索结果
  const filteredResources = state.resources;

  // 加载更多
  const loadMore = () => {
    if (!state.isLoading && state.hasMore) {
      fetchResources(state.cursor);
    }
  };

  if (status === 'loading' || (status === 'unauthenticated')) {
    return null;
  }

  return (
    <main className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="hover:bg-secondary/80"
        >
          <Link href="/admin">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">资源管理</h1>
      </div>

      <Card>
        <CardHeader className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl">资源列表</CardTitle>
              <p className="text-muted-foreground">管理所有开发资源</p>
              <p className="text-sm text-muted-foreground mt-1">
                {state.searchTerm 
                  ? `找到 ${filteredResources.length} 个相关资源`
                  : `共 ${state.total} 个资源`}
              </p>
            </div>
            <Button onClick={() => {
              setState((prevState) => ({ ...prevState, selectedResource: null, isDialogOpen: true }));
            }}>
              <Plus className="h-4 w-4 mr-2" />
              添加资源
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索资源..."
              value={state.searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>

        <CardContent>
          {state.isLoading && !state.cursor ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
              <p className="mt-4 text-muted-foreground">加载中...</p>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold">未找到相关资源</h2>
              <p className="mt-2 text-muted-foreground">
                {state.searchTerm ? '请尝试其他搜索条件' : '点击"添加资源"按钮创建新资源'}
              </p>
            </div>
          ) : (
            <>
              <div className="relative overflow-x-auto -mx-6">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-secondary/20">
                    <tr>
                      <th className="px-6 py-4 font-medium">资源</th>
                      <th className="px-6 py-4 font-medium hidden md:table-cell">分类</th>
                      <th className="px-6 py-4 font-medium hidden lg:table-cell">标签</th>
                      <th className="px-6 py-4 font-medium hidden md:table-cell">大小</th>
                      <th className="px-6 py-4 font-medium text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredResources.map(resource => (
                      <tr key={resource.id} className="bg-background hover:bg-secondary/10">
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="font-medium flex items-center gap-2">
                              {resource.title}
                              <div className="flex items-center gap-1">
                                <a
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-muted-foreground hover:text-primary"
                                  title="主链接"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                                {resource.links.map((link, index) => (
                                  <a
                                    key={index}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-muted-foreground hover:text-primary"
                                    title={`${link.platform}链接`}
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                ))}
                              </div>
                            </div>
                            <div className="text-muted-foreground text-xs line-clamp-2">
                              {resource.description}
                            </div>
                            <div className="text-xs text-muted-foreground md:hidden">
                              {resource.size && `大小: ${resource.size}`}
                            </div>
                            <div className="flex flex-wrap gap-1 md:hidden">
                              {resource.categories.map(category => (
                                <span
                                  key={category.name}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary"
                                >
                                  {category.name}
                                </span>
                              ))}
                            </div>
                            <div className="flex flex-wrap gap-1 lg:hidden">
                              {resource.tags.map(tag => (
                                <span
                                  key={tag.name}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-secondary/10 text-secondary-foreground"
                                >
                                  #{tag.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {resource.categories.map(category => (
                              <span
                                key={category.name}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary"
                              >
                                {category.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {resource.tags.map(tag => (
                              <span
                                key={tag.name}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-secondary/10 text-secondary-foreground"
                              >
                                #{tag.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          {resource.size}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setState((prevState) => ({ ...prevState, selectedResource: resource, isDialogOpen: true }));
                              }}
                              className="hover:bg-primary/10 hover:text-primary"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setState((prevState) => ({ ...prevState, selectedResource: resource, isDeleteDialogOpen: true }));
                              }}
                              className="hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {state.hasMore && (
                <div className="mt-6 text-center">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={state.isLoading}
                  >
                    {state.isLoading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                        加载中...
                      </>
                    ) : (
                      '加载更多'
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ResourceDialog
        open={state.isDialogOpen}
        onOpenChange={(open) => setState((prevState) => ({ ...prevState, isDialogOpen: open }))}
        initialData={state.selectedResource || undefined}
        onSuccess={fetchResources}
      />

      {state.selectedResource && (
        <DeleteDialog
          open={state.isDeleteDialogOpen}
          onOpenChange={(open) => setState((prevState) => ({ ...prevState, isDeleteDialogOpen: open }))}
          resourceId={state.selectedResource.id}
          resourceTitle={state.selectedResource.title}
          onSuccess={fetchResources}
        />
      )}
    </main>
  );
}
