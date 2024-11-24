import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function ResourceSkeleton() {
  return (
    <Card className="group relative overflow-hidden bg-gradient-to-br from-card to-muted/10 border-muted/50 p-5 sm:p-6">
      {/* 标题和收藏按钮 */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <Skeleton className="h-7 w-3/4 mb-1" />
          <Skeleton className="h-7 w-1/2" />
        </div>
        <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
      </div>

      {/* 描述文本 */}
      <div className="space-y-1.5 mb-4">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-11/12" />
      </div>

      {/* 资源大小 */}
      <div className="mb-4">
        <Skeleton className="h-6 w-16 rounded-md" />
      </div>

      {/* 分类和标签 */}
      <div className="flex flex-wrap gap-1.5 mb-4 min-h-[2.5rem]">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>

      {/* 底部按钮区域 */}
      <div className="flex flex-col gap-2">
        {/* 主要按钮 */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Skeleton className="h-9 w-full sm:w-1/2" />
          <Skeleton className="h-9 w-full sm:w-1/2" />
        </div>

        {/* 额外链接 */}
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-7 w-20 rounded-md" />
          <Skeleton className="h-7 w-24 rounded-md" />
          <Skeleton className="h-7 w-16 rounded-md" />
        </div>
      </div>
    </Card>
  );
}
