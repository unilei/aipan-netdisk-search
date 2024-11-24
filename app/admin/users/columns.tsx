import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { User } from '@/types/user';

interface ColumnsProps {
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
}

export const columns = ({ onEdit, onDelete }: ColumnsProps): ColumnDef<User>[] => [
  {
    accessorKey: 'name',
    header: '用户名',
    cell: ({ row }) => {
      const name = row.getValue('name') as string;
      return name || '未设置';
    },
  },
  {
    accessorKey: 'email',
    header: '邮箱',
  },
  {
    accessorKey: 'role',
    header: '角色',
    cell: ({ row }) => {
      const role = row.getValue('role') as string;
      return (
        <Badge variant={role === 'admin' ? 'destructive' : 'default'}>
          {role === 'admin' ? '管理员' : '普通用户'}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'emailVerified',
    header: '邮箱验证',
    cell: ({ row }) => {
      const verified = row.getValue('emailVerified') as Date | null;
      return verified ? (
        <Badge variant="success">已验证</Badge>
      ) : (
        <Badge variant="secondary">未验证</Badge>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const user = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">打开菜单</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>操作</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(user)}>
              <Pencil className="mr-2 h-4 w-4" />
              编辑
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(user.id)}
              className="text-red-600"
            >
              <Trash className="mr-2 h-4 w-4" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
