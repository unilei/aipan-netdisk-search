import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma, initializePrisma } from '@/lib/prisma-client';
import { z } from 'zod';

const tagSchema = z.object({
  name: z.string().min(1, '标签名称不能为空'),
});

// GET /api/tags
export async function GET() {
  try {
    await initializePrisma();
    
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: { resources: true }
        }
      },
      orderBy: {
        name: 'asc',
      },
    });
    return NextResponse.json(tags);
  } catch (error) {
    console.error('获取标签失败:', error);
    return NextResponse.json(
      { error: '获取标签失败' },
      { status: 500 }
    );
  }
}

// POST /api/tags
export async function POST(request: Request) {
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
    const validatedData = tagSchema.parse(json);

    const existingTag = await prisma.tag.findUnique({
      where: { name: validatedData.name },
    });

    if (existingTag) {
      return NextResponse.json(
        { error: '标签已存在' },
        { status: 400 }
      );
    }

    const tag = await prisma.tag.create({
      data: validatedData,
      include: {
        _count: {
          select: { resources: true }
        }
      },
    });

    return NextResponse.json(tag);
  } catch (error) {
    console.error('创建标签失败:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: '创建标签失败' },
      { status: 500 }
    );
  }
}

// PATCH /api/tags
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      );
    }

    const json = await request.json();
    const { id, ...data } = json;
    const validatedData = tagSchema.parse(data);

    const existingTag = await prisma.tag.findUnique({
      where: { name: validatedData.name },
    });

    if (existingTag && existingTag.id !== id) {
      return NextResponse.json(
        { error: '标签已存在' },
        { status: 400 }
      );
    }

    const tag = await prisma.tag.update({
      where: { id },
      data: validatedData,
      include: {
        _count: {
          select: { resources: true }
        }
      },
    });

    return NextResponse.json(tag);
  } catch (error) {
    console.error('更新标签失败:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: '更新标签失败' },
      { status: 500 }
    );
  }
}
