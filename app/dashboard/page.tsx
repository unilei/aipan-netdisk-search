'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">个人仪表板</h1>
      </div>

      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2">欢迎，{session?.user?.name || '用户'}</h2>
          <p className="text-muted-foreground">
            这是您的个人仪表板页面。您可以在这里管理您的资源和设置。
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-4">
            <h2 className="font-semibold mb-2">我的收藏</h2>
            <p className="text-sm text-muted-foreground">查看和管理您收藏的资源</p>
            <Button className="mt-4" variant="outline">
              查看收藏
            </Button>
          </Card>
          <Card className="p-4">
            <h2 className="font-semibold mb-2">个人资料</h2>
            <p className="text-sm text-muted-foreground">更新您的个人信息和偏好设置</p>
            <Button className="mt-4" variant="outline">
              编辑资料
            </Button>
          </Card>
          <Card className="p-4">
            <h2 className="font-semibold mb-2">浏览资源</h2>
            <p className="text-sm text-muted-foreground">发现和探索更多开发资源</p>
            <Link href="/">
              <Button className="mt-4" variant="outline">
                开始浏览
              </Button>
            </Link>
          </Card>
        </div>
      </Card>
    </div>
  );
}
