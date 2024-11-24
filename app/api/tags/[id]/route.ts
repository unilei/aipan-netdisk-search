import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma, initializePrisma } from '@/lib/prisma-client';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/tags/[id]
export async function GET(request: Request, props: Props) {
  const params = await props.params;
  try {
    await initializePrisma();
    const tag = await prisma.tag.findUnique({
      where: { id: params.id },
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

    if (!tag) {
      return NextResponse.json(
        { error: '标签不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json(tag);
  } catch (error) {
    console.error('获取标签失败:', error);
    return NextResponse.json(
      { error: '获取标签失败' },
      { status: 500 }
    );
  }
}

// DELETE /api/tags/[id]
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

    const tag = await prisma.tag.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { resources: true }
        }
      },
    });

    if (!tag) {
      return NextResponse.json(
        { error: '标签不存在' },
        { status: 404 }
      );
    }

    if (tag._count.resources > 0) {
      return NextResponse.json(
        { error: '该标签下还有资源，无法删除' },
        { status: 400 }
      );
    }

    await prisma.tag.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除标签失败:', error);
    return NextResponse.json(
      { error: '删除标签失败' },
      { status: 500 }
    );
  }
}
