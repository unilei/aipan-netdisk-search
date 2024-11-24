import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma, initializePrisma } from '@/lib/prisma-client';
import { hash } from 'bcryptjs';
import { z } from 'zod';

const userSchema = z.object({
  name: z.string().min(1, '请输入用户名'),
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少需要6个字符').optional(),
  role: z.enum(['user', 'admin'], {
    required_error: '请选择用户角色',
  }),
});

interface Props {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/users/[id]
export async function GET(request: Request, props: Props) {
  const params = await props.params;
  try {
    await initializePrisma();
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('获取用户失败:', error);
    return NextResponse.json(
      { error: '获取用户失败' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id]
export async function PUT(request: Request, props: Props) {
  const params = await props.params;
  try {
    await initializePrisma();
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      );
    }

    const json = await request.json();
    const validatedData = userSchema.parse(json);

    // 检查邮箱是否已被其他用户使用
    const existingUser = await prisma.user.findFirst({
      where: {
        email: validatedData.email,
        NOT: {
          id: params.id,
        },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: '邮箱已被使用' },
        { status: 400 }
      );
    }

    // 更新用户
    const updateData: any = {
      name: validatedData.name,
      email: validatedData.email,
      role: validatedData.role,
    };

    if (validatedData.password) {
      updateData.password = await hash(validatedData.password, 10);
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('更新用户失败:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: '更新用户失败' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id]
export async function DELETE(request: Request, props: Props) {
  const params = await props.params;
  try {
    await initializePrisma();
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      );
    }

    // 检查是否是最后一个管理员
    if (session.user.id === params.id) {
      const adminCount = await prisma.user.count({
        where: { role: 'admin' },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: '不能删除最后一个管理员' },
          { status: 400 }
        );
      }
    }

    await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除用户失败:', error);
    return NextResponse.json(
      { error: '删除用户失败' },
      { status: 500 }
    );
  }
}
