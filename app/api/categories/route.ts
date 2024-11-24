import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma, initializePrisma } from '@/lib/prisma-client';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().min(1, '分类名称不能为空'),
});

// GET /api/categories
export async function GET() {
  try {
    await initializePrisma();
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        resources: {
          select: {
            id: true,
            title: true,
            description: true,
            url: true,
            size: true,
            createdAt: true,
            updatedAt: true,
            categories: {
              select: {
                id: true,
                name: true,
              }
            },
            tags: {
              select: {
                id: true,
                name: true,
              }
            },
            links: {
              select: {
                id: true,
                url: true,
                platform: true,
              }
            },
            ...(userId ? {
              favorites: {
                where: { userId },
                select: { userId: true },
              },
            } : {}),
          }
        }
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Transform resources to include isFavorite flag
    const transformedCategories = categories.map(category => ({
      ...category,
      resources: category.resources.map(resource => ({
        ...resource,
        isFavorite: 'favorites' in resource ? resource.favorites.length > 0 : false,
      }))
    }));

    return NextResponse.json(transformedCategories);
  } catch (error) {
    console.error('获取分类失败:', error);
    // Return a more specific error message if available
    const errorMessage = error instanceof Error ? error.message : '获取分类失败';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// POST /api/categories
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
    const validatedData = categorySchema.parse(json);

    const existingCategory = await prisma.category.findUnique({
      where: { name: validatedData.name },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: '分类已存在' },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: validatedData,
      include: {
        _count: {
          select: { resources: true }
        }
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('创建分类失败:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: '创建分类失败' },
      { status: 500 }
    );
  }
}

// PATCH /api/categories
export async function PATCH(request: Request) {
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
    const { id, ...data } = json;
    const validatedData = categorySchema.parse(data);

    const existingCategory = await prisma.category.findUnique({
      where: { name: validatedData.name },
    });

    if (existingCategory && existingCategory.id !== id) {
      return NextResponse.json(
        { error: '分类已存在' },
        { status: 400 }
      );
    }

    const category = await prisma.category.update({
      where: { id },
      data: validatedData,
      include: {
        _count: {
          select: { resources: true }
        }
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('更新分类失败:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: '更新分类失败' },
      { status: 500 }
    );
  }
}
