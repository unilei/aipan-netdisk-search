import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceId: string;
  resourceTitle: string;
  resourceType?: 'resource' | 'category' | 'tag';
  onSuccess?: () => void;
}

export function DeleteDialog({
  open,
  onOpenChange,
  resourceId,
  resourceTitle,
  resourceType = 'resource',
  onSuccess,
}: DeleteDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setIsLoading(true);

      const endpoint = resourceType === 'resource'
        ? `/api/resources/${resourceId}`
        : resourceType === 'category'
        ? `/api/categories/${resourceId}`
        : `/api/tags/${resourceId}`;

      const response = await fetch(endpoint, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '删除失败');
      }

      toast.success('删除成功');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('删除失败:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('删除失败');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>确认删除</DialogTitle>
          <DialogDescription>
            您确定要删除{resourceType === 'category' ? '分类' : resourceType === 'tag' ? '标签' : '资源'} "{resourceTitle}" 吗？此操作不可撤销。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? '删除中...' : '删除'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
