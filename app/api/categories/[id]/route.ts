import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma, initializePrisma } from '@/lib/prisma-client';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/categories/[id]
export async function GET(request: Request, props: Props) {
  const { id } = await props.params;
  
  try {
    await initializePrisma();
    
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        resources: {
          include: {
            categories: true,
            tags: true,
          },
        },
        _count: {
          select: { resources: true }
        }
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: '分类不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('获取分类失败:', error);
    return NextResponse.json(
      { error: '获取分类失败' },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/[id]
export async function DELETE(request: Request, props: Props) {
  const { id } = await props.params;
  
  try {
    await initializePrisma();
    
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      );
    }

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { resources: true }
        }
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: '分类不存在' },
        { status: 404 }
      );
    }

    if (category._count.resources > 0) {
      return NextResponse.json(
        { error: '该分类下还有资源，无法删除' },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除分类失败:', error);
    return NextResponse.json(
      { error: '删除分类失败' },
      { status: 500 }
    );
  }
}
