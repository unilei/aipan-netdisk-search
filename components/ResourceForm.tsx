import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';

const resourceSchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  description: z.string().min(1, '描述不能为空'),
  url: z.string().url('请输入有效的 URL'),
  size: z.string().optional(),
  categories: z.string().min(1, '请输入分类'),
  tags: z.string().min(1, '请输入标签'),
  links: z.array(z.object({
    platform: z.string().min(1, '平台名称不能为空'),
    url: z.string().url('请输入有效的 URL'),
  })),
});

type FormData = z.infer<typeof resourceSchema>;

interface ResourceFormProps {
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
  onCancel?: () => void;
}

export function ResourceForm({ initialData, onSuccess, onCancel }: ResourceFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!initialData?.id;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      url: initialData?.url || '',
      size: initialData?.size || '',
      categories: initialData?.categories.map(c => c.name).join(', ') || '',
      tags: initialData?.tags.map(t => t.name).join(', ') || '',
      links: initialData?.links || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "links",
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);

      // 确保 categories 和 tags 是字符串
      const categoriesStr = typeof data.categories === 'string' ? data.categories : '';
      const tagsStr = typeof data.tags === 'string' ? data.tags : '';

      const categories = categoriesStr.split(',').map(name => ({
        name: name.trim(),
      })).filter(c => c.name);

      const tags = tagsStr.split(',').map(name => ({
        name: name.trim(),
      })).filter(t => t.name);

      const links = Array.isArray(data.links) ? data.links : [];

      const payload = {
        title: data.title?.trim(),
        description: data.description?.trim(),
        url: data.url?.trim(),
        size: data.size?.trim() || undefined,
        categories,
        tags,
        links,
      };

      if (!payload.title || !payload.description || !payload.url) {
        throw new Error('请填写所有必填字段');
      }

      const response = await fetch(
        isEditing ? `/api/resources/${initialData?.id}` : '/api/resources',
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '操作失败');
      }

      toast.success(isEditing ? '资源已更新' : '资源已创建');
      onSuccess?.();
    } catch (error) {
      console.error('表单提交失败:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('操作失败');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="title">
          标题
        </label>
        <Input
          id="title"
          {...register('title')}
          placeholder="输入资源标题"
          disabled={isLoading}
        />
        {errors.title && (
          <p className="text-sm text-red-500">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="description">
          描述
        </label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="输入资源描述"
          disabled={isLoading}
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="url">
          主链接
        </label>
        <Input
          id="url"
          {...register('url')}
          placeholder="输入资源主链接"
          disabled={isLoading}
        />
        {errors.url && (
          <p className="text-sm text-red-500">{errors.url.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="size">
          大小
        </label>
        <Input
          id="size"
          {...register('size')}
          placeholder="输入资源大小（可选）"
          disabled={isLoading}
        />
        {errors.size && (
          <p className="text-sm text-red-500">{errors.size.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="categories">
          分类
        </label>
        <Input
          id="categories"
          {...register('categories')}
          placeholder="输入分类，用逗号分隔"
          disabled={isLoading}
        />
        {errors.categories && (
          <p className="text-sm text-red-500">{errors.categories.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="tags">
          标签
        </label>
        <Input
          id="tags"
          {...register('tags')}
          placeholder="输入标签，用逗号分隔"
          disabled={isLoading}
        />
        {errors.tags && (
          <p className="text-sm text-red-500">{errors.tags.message}</p>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">额外链接</label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ platform: '', url: '' })}
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-1" />
            添加链接
          </Button>
        </div>
        
        {fields.map((field, index) => (
          <div key={field.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  {...register(`links.${index}.platform`)}
                  placeholder="平台名称（如：quark）"
                  disabled={isLoading}
                />
                {errors.links?.[index]?.platform && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.links[index]?.platform?.message}
                  </p>
                )}
              </div>
              <div className="flex-[2]">
                <Input
                  {...register(`links.${index}.url`)}
                  placeholder="链接地址"
                  disabled={isLoading}
                />
                {errors.links?.[index]?.url && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.links[index]?.url?.message}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                disabled={isLoading}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            取消
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? '提交中...' : isEditing ? '更新' : '创建'}
        </Button>
      </div>
    </form>
  );
}
