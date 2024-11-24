'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Plus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import { columns } from './columns';
import { UserDialog } from './user-dialog';
import { toast } from 'sonner';
import { User } from '@/types/user';

export default function UsersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // 检查管理员权限
  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && session?.user?.role !== 'admin')) {
      router.push('/login');
    }
  }, [session, status, router]);

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/users');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '获取用户列表失败');
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('获取用户列表失败:', error);
      toast.error(error instanceof Error ? error.message : '获取用户列表失败');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 首次加载时获取用户列表
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchUsers();
    }
  }, [status, session]);

  // 创建用户
  const handleCreate = () => {
    setSelectedUser(null);
    setDialogOpen(true);
  };

  // 编辑用户
  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  // 删除用户
  const handleDelete = async (userId: string) => {
    if (!confirm('确定要删除此用户吗？')) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '删除用户失败');
      }

      toast.success('用户已删除');
      fetchUsers();
    } catch (error) {
      console.error('删除用户失败:', error);
      toast.error(error instanceof Error ? error.message : '删除用户失败');
    }
  };

  // 对话框关闭
  const handleDialogClose = (refresh?: boolean) => {
    setDialogOpen(false);
    setSelectedUser(null);
    if (refresh) {
      fetchUsers();
    }
  };

  // 返回上一页
  const handleBack = () => {
    router.back();
  };

  if (status === 'loading' || status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 flex justify-between items-center">
          <h1 className="text-2xl font-bold">用户管理</h1>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            添加用户
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns({ onEdit: handleEdit, onDelete: handleDelete })}
        data={users}
        isLoading={isLoading}
      />

      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={selectedUser}
        onClose={handleDialogClose}
      />
    </div>
  );
}
