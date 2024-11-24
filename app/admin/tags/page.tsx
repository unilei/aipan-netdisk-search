'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TagDialog } from '@/components/TagDialog';
import { DeleteDialog } from '@/components/DeleteDialog';
import { toast } from 'sonner';

interface Tag {
  id: string;
  name: string;
  _count: {
    resources: number;
  };
}

interface PageState {
  tags: Tag[];
  isLoading: boolean;
  selectedTag: Tag | null;
  isDialogOpen: boolean;
  isDeleteDialogOpen: boolean;
}

export default function TagsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [state, setState] = useState<PageState>({
    tags: [],
    isLoading: true,
    selectedTag: null,
    isDialogOpen: false,
    isDeleteDialogOpen: false,
  });

  // 检查管理员权限
  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && session?.user?.role !== 'admin')) {
      router.push('/login');
    }
  }, [session, status, router]);

  // 获取所有标签
  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags', {
        cache: 'no-store'
      });
      if (!response.ok) throw new Error('加载标签失败');
      const data = await response.json();
      setState((prevState) => ({ ...prevState, tags: data }));
    } catch (error) {
      console.error('加载标签失败:', error);
      toast.error('加载标签失败');
    } finally {
      setState((prevState) => ({ ...prevState, isLoading: false }));
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  // 删除标签
  const handleDelete = () => {
    setState((prevState) => ({
      ...prevState,
      isDeleteDialogOpen: false,
      selectedTag: null,
    }));
    fetchTags();
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
        <h1 className="text-2xl font-bold">标签管理</h1>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl">标签列表</CardTitle>
          <Button onClick={() => {
            setState((prevState) => ({ ...prevState, selectedTag: null, isDialogOpen: true }));
          }}>
            <Plus className="h-4 w-4 mr-2" />
            添加标签
          </Button>
        </CardHeader>

        <CardContent>
          {state.isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
              <p className="mt-4 text-muted-foreground">加载中...</p>
            </div>
          ) : state.tags.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold">暂无标签</h2>
              <p className="mt-2 text-muted-foreground">
                点击"添加标签"按钮创建新标签
              </p>
            </div>
          ) : (
            <div className="relative overflow-x-auto -mx-6">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-secondary/20">
                  <tr>
                    <th className="px-6 py-4 font-medium">名称</th>
                    <th className="px-6 py-4 font-medium">资源数量</th>
                    <th className="px-6 py-4 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {state.tags.map(tag => (
                    <tr key={tag.id} className="bg-background hover:bg-secondary/10">
                      <td className="px-6 py-4 font-medium">
                        {tag.name}
                      </td>
                      <td className="px-6 py-4">
                        {tag._count.resources} 个资源
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setState((prevState) => ({ ...prevState, selectedTag: tag, isDialogOpen: true }));
                            }}
                            className="hover:bg-primary/10 hover:text-primary"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setState((prevState) => ({ ...prevState, selectedTag: tag, isDeleteDialogOpen: true }));
                            }}
                            className="hover:bg-destructive/10 hover:text-destructive"
                            disabled={tag._count.resources > 0}
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
          )}
        </CardContent>
      </Card>

      <TagDialog
        open={state.isDialogOpen}
        onOpenChange={(open) => setState((prevState) => ({ ...prevState, isDialogOpen: open }))}
        initialData={state.selectedTag || undefined}
        onSuccess={fetchTags}
      />

      {state.selectedTag && (
        <DeleteDialog
          open={state.isDeleteDialogOpen}
          onOpenChange={(open) => setState((prevState) => ({ ...prevState, isDeleteDialogOpen: open }))}
          resourceId={state.selectedTag.id}
          resourceTitle={state.selectedTag.name}
          resourceType="tag"
          onSuccess={handleDelete}
        />
      )}
    </main>
  );
}
