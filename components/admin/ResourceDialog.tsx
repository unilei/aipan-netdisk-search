import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface BaseResource {
  title: string;
  description: string;
  url: string;
  categories: { name: string }[];
  tags: { name: string }[];
}

interface Resource extends BaseResource {
  id: string;
  isFavorite: boolean;
}

interface ResourceFormData {
  title: string;
  description: string;
  url: string;
  categories: string;
  tags: string;
}

interface ResourceDialogProps {
  resource: Resource | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: BaseResource) => void;
}

const formSchema = z.object({
  title: z.string().min(1, '请输入标题'),
  description: z.string().min(1, '请输入描述'),
  url: z.string().url('请输入有效的URL'),
  categories: z.string(),
  tags: z.string(),
});

export default function ResourceDialog({
  resource,
  open,
  onOpenChange,
  onSubmit,
}: ResourceDialogProps) {
  const form = useForm<ResourceFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      url: '',
      categories: '',
      tags: '',
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        title: resource?.title || '',
        description: resource?.description || '',
        url: resource?.url || '',
        categories: resource?.categories.map(c => c.name).join(', ') || '',
        tags: resource?.tags.map(t => t.name).join(', ') || '',
      });
    }
  }, [open, resource, form]);

  const handleSubmit = (values: ResourceFormData) => {
    const categories = values.categories
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(name => ({ name }));

    const tags = values.tags
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(name => ({ name }));

    onSubmit({
      title: values.title,
      description: values.description,
      url: values.url,
      categories,
      tags,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{resource ? '编辑资源' : '添加资源'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>标题</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="输入资源标题" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>描述</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="输入资源描述" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="输入资源URL" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categories"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>分类</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="输入分类，用逗号分隔" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>标签</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="输入标签，用逗号分隔" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                取消
              </Button>
              <Button type="submit">
                {resource ? '保存' : '创建'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
