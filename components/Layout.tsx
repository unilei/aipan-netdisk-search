'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, Home, Grid2X2, Star, LogOut, User } from 'lucide-react';
import { toast } from 'sonner';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const navigation = [
    {
      name: '首页',
      href: '/',
      icon: Home,
    },
    {
      name: '分类',
      href: '/categories',
      icon: Grid2X2,
    },
    {
      name: '收藏',
      href: '/favorites',
      icon: Star,
    },
  ];

  const MobileNav = ({ className }: { className?: string }) => (
    <div className={className}>
      {navigation.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'flex items-center text-sm font-medium transition-colors hover:text-primary',
            pathname === item.href
              ? 'text-black dark:text-white'
              : 'text-muted-foreground'
          )}
        >
          <item.icon className="h-4 w-4 mr-2" />
          {item.name}
        </Link>
      ))}
    </div>
  );

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false });
      toast.success('已退出登录');
    } catch (error) {
      toast.error('退出登录失败');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* 导航栏 */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container h-14 flex items-center">
          {/* 移动端菜单按钮 */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">导航菜单</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader className="border-b pb-4 mb-4">
                <SheetTitle>导航菜单</SheetTitle>
              </SheetHeader>
              <MobileNav className="flex flex-col space-y-4" />
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <div className="mr-4 hidden md:flex">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold bg-gradient-to-r from-primary/90 to-primary bg-clip-text text-transparent">
                爱盼短剧
              </span>
            </Link>
          </div>

          {/* 桌面端导航 */}
          <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
            {navigation.map((item) => (
              <Button
                key={item.name}
                variant={pathname === item.href ? 'default' : 'ghost'}
                size="sm"
                asChild
              >
                <Link href={item.href} className="flex items-center space-x-2">
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              </Button>
            ))}
          </nav>

          {/* 用户菜单 */}
          <div className="flex ml-auto items-center space-x-4">
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-sm font-medium">
                    {session.user?.name || '用户'}
                  </div>
                  <DropdownMenuSeparator />
                  {session.user?.role === 'admin' ? (
                    <Link href="/admin">
                      <DropdownMenuItem>
                        管理后台
                      </DropdownMenuItem>
                    </Link>
                  ) : (
                    <Link href="/dashboard">
                      <DropdownMenuItem>
                        个人仪表板
                      </DropdownMenuItem>
                    </Link>
                  )}
                  <DropdownMenuItem onClick={handleSignOut}>
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">登录</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">注册</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 页面内容 */}
      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              2024 资源导航平台 | 版权所有
            </p>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            发现、收藏、分享优质资源
          </p>
        </div>
      </footer>
    </div>
  );
}
