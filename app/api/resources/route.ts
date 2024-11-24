import { NextResponse } from 'next/server';
import { prisma, initializePrisma } from '@/lib/prisma-client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { resourceCache } from '@/lib/cache';
import { getCategories, getTags } from '@/lib/queries';

// 资源验证模式
const resourceSchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  description: z.string().min(1, '描述不能为空'),
  url: z.string().url('请输入有效的 URL'),
  size: z.string().optional(),
  categories: z.array(z.object({
    name: z.string().min(1, '分类名称不能为空'),
  })),
  tags: z.array(z.object({
    name: z.string().min(1, '标签名称不能为空'),
  })),
  links: z.array(z.object({
    url: z.string().url('请输入有效的 URL'),
    platform: z.string().min(1, '平台名称不能为空'),
  })).optional(),
});

// GET /api/resources
export async function GET(request: Request) {
  try {
    await initializePrisma();
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const take = parseInt(searchParams.get('take') || '10');
    const searchTerm = searchParams.get('search') || '';
    const favorite = searchParams.get('favorite') === 'true';
    const categories = searchParams.get('categories')?.split(',').filter(Boolean) || [];
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (favorite && !userId) {
      return NextResponse.json({ 
        resources: [], 
        nextCursor: null,
        total: 0 
      });
    }

    // 构建查询条件
    const where = {
      AND: [
        searchTerm ? {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' as const } },
            { description: { contains: searchTerm, mode: 'insensitive' as const } }
          ]
        } : {},
        categories.length > 0 ? {
          categories: {
            some: {
              name: {
                in: categories
              }
            }
          }
        } : {},
        tags.length > 0 ? {
          tags: {
            some: {
              name: {
                in: tags
              }
            }
          }
        } : {},
        favorite && userId ? {
          favorites: {
            some: {
              userId
            }
          }
        } : {}
      ]
    };

    // 生成缓存键
    const cacheKey = `resources:${JSON.stringify({
      cursor,
      take,
      searchTerm,
      favorite,
      categories: categories.sort(),
      tags: tags.sort(),
      userId,
      timestamp: Date.now() - (Date.now() % 1000), // 按秒取整，减少缓存键的数量
    })}`;

    // 使用缓存获取数据
    const { resources, nextCursor, total } = await resourceCache.get(
      cacheKey,
      async () => {
        const [resources, total] = await Promise.all([
          prisma.resource.findMany({
            where,
            take: take + 1,
            cursor: cursor ? { id: cursor } : undefined,
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
              creator: {
                select: { 
                  id: true, 
                  name: true, 
                  email: true 
                }
              },
              links: {
                select: {
                  id: true,
                  url: true,
                  platform: true,
                }
              },
              favorites: userId ? {
                where: { userId },
                select: { userId: true },
              } : false,
              _count: {
                select: {
                  favorites: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc',
            },
          }),
          prisma.resource.count({ where })
        ]);

        let nextCursor: string | null = null;
        if (resources.length > take) {
          const nextItem = resources.pop();
          nextCursor = nextItem?.id || null;
        }

        const resourcesWithFavorites = resources.map(resource => ({
          ...resource,
          isFavorite: resource.favorites ? resource.favorites.length > 0 : false,
          favoritesCount: resource._count.favorites,
          favorites: undefined,
          _count: undefined
        }));

        return {
          resources: resourcesWithFavorites,
          nextCursor,
          total
        };
      },
      { ttl: 1000 * 60 * 5 } // 5分钟缓存
    );

    return NextResponse.json({
      resources,
      nextCursor,
      total
    });
  } catch (error) {
    console.error('获取资源失败:', error);
    return NextResponse.json(
      { error: '获取资源失败' },
      { status: 500 }
    );
  }
}

// POST /api/resources
export async function POST(request: Request) {
  try {
    await initializePrisma();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin') {
      console.log('Session validation failed:', session);
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      );
    }

    const userId = session.user.id;
    // 验证用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (!user) {
      console.error('User not found:', userId);
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    const json = await request.json();
    const validatedData = resourceSchema.parse(json);
    const resource = await prisma.resource.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        url: validatedData.url,
        size: validatedData.size,
        creatorId: userId,
        categories: {
          connectOrCreate: validatedData.categories.map(category => ({
            where: { name: category.name },
            create: { name: category.name },
          })),
        },
        tags: {
          connectOrCreate: validatedData.tags.map(tag => ({
            where: { name: tag.name },
            create: { name: tag.name },
          })),
        },
        links: {
          create: validatedData.links?.map(link => ({
            url: link.url,
            platform: link.platform,
          })) || [],
        },
      },
      include: {
        categories: true,
        tags: true,
        creator: {
          select: { id: true, name: true, email: true },
        },
        links: true,
      },
    });

    return NextResponse.json(resource);
  } catch (error) {
    console.error('创建资源失败:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: '创建资源失败' },
      { status: 500 }
    );
  }
}

// PATCH /api/resources
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
    const validatedData = resourceSchema.parse(data);

    const resource = await prisma.resource.update({
      where: { id },
      data: {
        title: validatedData.title,
        description: validatedData.description,
        url: validatedData.url,
        size: validatedData.size,
        categories: {
          set: [],
          connectOrCreate: validatedData.categories.map(category => ({
            where: { name: category.name },
            create: { name: category.name },
          })),
        },
        tags: {
          set: [],
          connectOrCreate: validatedData.tags.map(tag => ({
            where: { name: tag.name },
            create: { name: tag.name },
          })),
        },
        links: {
          deleteMany: {},
          create: validatedData.links?.map(link => ({
            url: link.url,
            platform: link.platform,
          })) || [],
        },
      },
      include: {
        categories: true,
        tags: true,
        creator: {
          select: { id: true, name: true, email: true },
        },
        links: true,
      },
    });

    return NextResponse.json(resource);
  } catch (error) {
    console.error('更新资源失败:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: '更新资源失败' },
      { status: 500 }
    );
  }
}
