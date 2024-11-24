'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Library,
  Tags,
  Users,
  Settings,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const menuItems = [
  {
    title: '资源管理',
    description: '管理所有开发资源',
    icon: Library,
    href: '/admin/resources',
    color: 'text-blue-500',
  },
  {
    title: '分类管理',
    description: '管理资源分类',
    icon: Tags,
    href: '/admin/categories',
    color: 'text-green-500',
  },
  {
    title: '标签管理',
    description: '管理资源标签',
    icon: Tags,
    href: '/admin/tags',
    color: 'text-purple-500',
  },
  {
    title: '用户管理',
    description: '管理用户账号',
    icon: Users,
    href: '/admin/users',
    color: 'text-orange-500',
  },
  {
    title: '系统设置',
    description: '管理系统配置',
    icon: Settings,
    href: '/admin/settings',
    color: 'text-gray-500',
  },
];

interface Stats {
  resourceCount: number;
  categoryCount: number;
  tagCount: number;
  userCount: number;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    resourceCount: 0,
    categoryCount: 0,
    tagCount: 0,
    userCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // 检查管理员权限
  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && session?.user?.role !== 'admin')) {
      router.push('/login');
    }
  }, [session, status, router]);

  // 获取统计数据
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats', {
          cache: 'no-store'
        });
        if (!response.ok) throw new Error('加载统计数据失败');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('加载统计数据失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.role === 'admin') {
      fetchStats();
    }
  }, [session]);

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
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">管理后台</h1>
          {session?.user && (
            <p className="text-muted-foreground">欢迎回来，{session.user.name || session.user.email}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <Card
            key={item.href}
            className="hover:shadow-lg transition-shadow duration-200"
          >
            <Link href={item.href}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg bg-secondary/20 ${item.color}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{item.description}</p>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">快速统计</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-secondary/10">
            <div className="text-2xl font-bold">{isLoading ? '-' : stats.resourceCount}</div>
            <div className="text-muted-foreground">总资源数</div>
          </div>
          <div className="p-4 rounded-lg bg-secondary/10">
            <div className="text-2xl font-bold">{isLoading ? '-' : stats.categoryCount}</div>
            <div className="text-muted-foreground">分类数量</div>
          </div>
          <div className="p-4 rounded-lg bg-secondary/10">
            <div className="text-2xl font-bold">{isLoading ? '-' : stats.tagCount}</div>
            <div className="text-muted-foreground">标签数量</div>
          </div>
          <div className="p-4 rounded-lg bg-secondary/10">
            <div className="text-2xl font-bold">{isLoading ? '-' : stats.userCount}</div>
            <div className="text-muted-foreground">用户数量</div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
