import React from 'react';
import Link from 'next/link';
import { ExternalLink, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ResourceCardProps {
  id: string;
  title: string;
  description: string;
  url: string;
  size?: string;
  categories: string[];
  tags: string[];
  isFavorite: boolean;
  links: { platform: string; url: string }[];
  onToggleFavorite: () => void;
}

export default function ResourceCard({
  id,
  title,
  description,
  url,
  size,
  categories,
  tags,
  isFavorite,
  links,
  onToggleFavorite,
}: ResourceCardProps) {
  return (
    <Card className="group relative overflow-hidden bg-gradient-to-br from-card to-muted/10 hover:to-muted/20 border-muted/50 hover:border-primary/50 hover:shadow-lg transition-all duration-300">
      {/* 悬停渐变效果 */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-secondary/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ mixBlendMode: 'overlay' }}
      />

      {/* 卡片内容 */}
      <div className="relative h-full flex flex-col p-5 sm:p-6">
        {/* 标题和收藏按钮 */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <Link 
            href={`/resources/${id}`} 
            className="group/title flex-1 hover:underline decoration-primary/30 underline-offset-4"
          >
            <h3 className="text-lg sm:text-xl font-semibold line-clamp-2 group-hover/title:text-primary transition-colors">
              {title}
            </h3>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleFavorite}
            title={isFavorite ? '取消收藏' : '添加收藏'}
            className={cn(
              "shrink-0 -mt-1 transition-all duration-300 hover:bg-transparent",
              isFavorite 
                ? "text-yellow-500 hover:text-yellow-600 hover:scale-110" 
                : "text-muted-foreground hover:text-yellow-500 hover:scale-110"
            )}
          >
            <Star 
              className="h-5 w-5 transition-transform duration-300"
              fill={isFavorite ? 'currentColor' : 'none'}
              strokeWidth={2}
            />
          </Button>
        </div>

        {/* 描述文本 */}
        <p className="text-sm sm:text-sm text-muted-foreground/90 line-clamp-2 leading-relaxed group-hover:text-muted-foreground transition-colors mb-4">
          {description}
        </p>

        {/* 资源大小 */}
        {size && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-xs text-muted-foreground px-2 py-1 rounded-md bg-muted/50">
              {size}
            </span>
          </div>
        )}

        {/* 分类和标签 */}
        <div className="flex-1 flex flex-wrap items-start gap-2 min-h-[2.5rem] mb-4">
          {categories.map((category, index) => (
            <Link
              key={category}
              href={`/?category=${encodeURIComponent(category)}`}
              className={cn(
                "inline-flex h-6 items-center px-2.5 rounded-full text-xs font-medium",
                "bg-primary/[0.08] text-primary hover:bg-primary/[0.12]",
                "transition-all duration-200",
                "border border-primary/10 hover:border-primary/20"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {category}
            </Link>
          ))}
          {tags.map((tag, index) => (
            <Link
              key={tag}
              href={`/?tag=${encodeURIComponent(tag)}`}
              className={cn(
                "inline-flex h-6 items-center px-2.5 rounded-full text-xs font-medium",
                "bg-secondary/[0.08] text-secondary-foreground/80 hover:text-secondary-foreground",
                "hover:bg-secondary/[0.12] transition-all duration-200",
                "border border-secondary/10 hover:border-secondary/20"
              )}
              style={{ animationDelay: `${(categories.length + index) * 50}ms` }}
            >
              #{tag}
            </Link>
          ))}
        </div>

        {/* 底部按钮 */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="sm:flex-1 justify-center bg-primary/[0.04] hover:bg-primary/[0.08] hover:text-primary transition-all duration-200"
            >
              <Link href={`/resources/${id}`} className="flex items-center space-x-2">
                <span>查看详情</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="sm:flex-1 justify-center bg-card hover:bg-secondary/[0.05] hover:border-secondary/30 transition-all duration-200 group/link"
            >
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2"
              >
                <span>主链接</span>
                <ExternalLink className="h-4 w-4 transition-transform duration-200 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
              </a>
            </Button>
          </div>

          {/* 额外链接 */}
          {links.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {links.map((link, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-7 px-2 hover:bg-secondary/[0.05] text-muted-foreground hover:text-secondary-foreground"
                >
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1.5"
                  >
                    <span className="text-xs">{link.platform}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
