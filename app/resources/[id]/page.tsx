'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, ExternalLink, Star, Calendar, Clock, Share2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Layout from '@/components/Layout';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
}

interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  size?: string;
  categories: Category[];
  tags: Tag[];
  links: { platform: string; url: string }[];
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ResourceDetail({ params }: { params: Promise<{ id: string }> }) {
  const [resource, setResource] = useState<Resource | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const resolvedParams = React.use(params);

  useEffect(() => {
    const fetchResource = async () => {
      try {
        const response = await fetch(`/api/resources/${resolvedParams.id}`);
        if (!response.ok) throw new Error('Failed to fetch resource');
        const data = await response.json();
        setResource(data);
      } catch (error) {
        toast.error('加载资源失败');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResource();
  }, [resolvedParams.id]);

  const handleToggleFavorite = async () => {
    if (!resource) return;

    try {
      const response = await fetch(`/api/resources/${resource.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...resource,
          isFavorite: !resource.isFavorite,
          categories: resource.categories.map(c => c.name),
          tags: resource.tags.map(t => t.name),
        }),
      });

      if (!response.ok) throw new Error('Failed to update resource');

      setResource(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
      toast.success(resource.isFavorite ? '已取消收藏' : '已添加到收藏');
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('链接已复制到剪贴板');
    } catch (error) {
      toast.error('复制链接失败');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6 space-y-8 animate-pulse">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-24 bg-muted rounded" />
          <div className="space-y-4">
            <div className="h-6 w-32 bg-muted rounded" />
            <div className="flex gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-8 w-24 bg-muted rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!resource) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6 text-center">
          <h1 className="text-2xl font-semibold text-foreground">资源不存在</h1>
          <p className="mt-2 text-muted-foreground">该资源可能已被删除或移动</p>
          <Button asChild className="mt-6">
            <Link href="/">返回首页</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* 返回按钮 */}
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="mb-6 hover:bg-transparent hover:text-primary"
        >
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span>返回</span>
          </Link>
        </Button>

        {/* 资源卡片 */}
        <Card className="p-6 sm:p-8 space-y-8">
          {/* 标题区域 */}
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
                {resource.title}
              </h1>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShare}
                  title="分享"
                  className="shrink-0 transition-all duration-300 hover:bg-transparent hover:text-primary hover:scale-110"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleFavorite}
                  title={resource.isFavorite ? '取消收藏' : '添加收藏'}
                  className={cn(
                    "shrink-0 transition-all duration-300 hover:bg-transparent",
                    resource.isFavorite 
                      ? "text-yellow-500 hover:text-yellow-600 hover:scale-110" 
                      : "text-muted-foreground hover:text-yellow-500 hover:scale-110"
                  )}
                >
                  <Star 
                    className="h-5 w-5 transition-transform duration-300"
                    fill={resource.isFavorite ? 'currentColor' : 'none'}
                    strokeWidth={2}
                  />
                </Button>
              </div>
            </div>

            {/* 时间信息 */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>创建于 {formatDate(resource.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>更新于 {formatDate(resource.updatedAt)}</span>
              </div>
            </div>
          </div>

          {/* 描述 */}
          <div className="space-y-2">
            <h2 className="font-medium">资源介绍</h2>
            <div className="p-4 rounded-lg bg-muted/30 text-base sm:text-lg text-muted-foreground leading-relaxed">
              {resource.description}
            </div>
          </div>

          {/* 资源信息 */}
          <div className="grid gap-6 sm:grid-cols-2">
            {/* 资源大小 */}
            {resource.size && (
              <div className="flex-1 space-y-2">
                <h2 className="font-medium">资源大小</h2>
                <div className="p-3 rounded-lg bg-muted/30 text-base text-muted-foreground">
                  {resource.size}
                </div>
              </div>
            )}

            {/* 资源链接 */}
            {resource.links && resource.links.length > 0 && (
              <div className="flex-1 space-y-2">
                <h2 className="font-medium">额外链接</h2>
                <div className="flex flex-wrap gap-2">
                  {resource.links.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "inline-flex h-8 items-center px-3 rounded-lg gap-2",
                        "bg-secondary/[0.08] text-secondary-foreground/80 hover:text-secondary-foreground",
                        "hover:bg-secondary/[0.12] transition-all duration-200",
                        "border border-secondary/10 hover:border-secondary/20"
                      )}
                    >
                      <span>{link.platform}</span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 分类和标签 */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex-1 space-y-2">
              <h2 className="font-medium">分类</h2>
              <div className="flex flex-wrap gap-2">
                {resource.categories.map((category, index) => (
                  <Link
                    key={`${category.id || category.name}-${index}`}
                    href={`/?category=${encodeURIComponent(category.name)}`}
                    className={cn(
                      "inline-flex h-7 items-center px-3 rounded-full text-sm",
                      "bg-primary/[0.08] text-primary hover:bg-primary/[0.12]",
                      "transition-all duration-200",
                      "border border-primary/10 hover:border-primary/20"
                    )}
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex-1 space-y-2">
              <h2 className="font-medium">标签</h2>
              <div className="flex flex-wrap gap-2">
                {resource.tags.map((tag, index) => (
                  <Link
                    key={`${tag.id || tag.name}-${index}`}
                    href={`/?tag=${encodeURIComponent(tag.name)}`}
                    className={cn(
                      "inline-flex h-7 items-center px-3 rounded-full text-sm",
                      "bg-secondary/[0.08] text-secondary-foreground/80 hover:text-secondary-foreground",
                      "hover:bg-secondary/[0.12] transition-all duration-200",
                      "border border-secondary/10 hover:border-secondary/20"
                    )}
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* 访问按钮 */}
          <div className="pt-4 border-t border-border">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                size="lg"
                asChild
                className="w-full sm:w-auto justify-center hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 group"
              >
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <span>访问主链接</span>
                  <ExternalLink className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </Button>
              {resource.links && resource.links.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {resource.links.map((link, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="lg"
                      asChild
                      className="px-4 justify-center hover:bg-secondary/5 hover:text-secondary-foreground transition-all duration-200 group"
                    >
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <span>{link.platform}</span>
                        <ExternalLink className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </a>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}