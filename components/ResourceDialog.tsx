import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ResourceForm } from './ResourceForm';

interface ResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    id?: string;
    title: string;
    description: string;
    url: string;
    size?: string;
    categories: { name: string }[];
    tags: { name: string }[];
    links: { url: string; platform: string }[];
  };
  onSuccess?: () => void;
}

export function ResourceDialog({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: ResourceDialogProps) {
  const isEditing = !!initialData?.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? '编辑资源' : '创建资源'}
          </DialogTitle>
        </DialogHeader>
        <ResourceForm
          initialData={initialData}
          onSuccess={() => {
            onOpenChange(false);
            onSuccess?.();
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
