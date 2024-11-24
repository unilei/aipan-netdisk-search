import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma, initializePrisma } from '@/lib/prisma-client';
import { resourceCache } from '@/lib/cache';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/resources/[id]
export async function GET(request: Request, props: Props) {
  const params = await props.params;
  try {
    await initializePrisma();
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    console.log('Current session:', session); // 添加调试日志

    const resource = await prisma.resource.findUnique({
      where: { id: params.id },
      include: {
        categories: {
          select: { name: true },
        },
        tags: {
          select: { name: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
        links: {
          select: { url: true, platform: true },
        },
        ...(userId ? {
          favorites: {
            where: { userId },
            select: { userId: true },
          },
        } : {}),
      },
    });

    if (!resource) {
      return NextResponse.json(
        { error: '资源不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      url: resource.url,
      size: resource.size,
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
      categories: resource.categories,
      tags: resource.tags,
      creator: resource.creator,
      links: resource.links,
      isFavorite: 'favorites' in resource ? resource.favorites.length > 0 : false,
    });
  } catch (error) {
    console.error('获取资源失败:', error);
    return NextResponse.json(
      { error: '获取资源失败' },
      { status: 500 }
    );
  }
}

// DELETE /api/resources/[id]
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

    const resource = await prisma.resource.findUnique({
      where: { id: params.id },
    });

    if (!resource) {
      return NextResponse.json(
        { error: '资源不存在' },
        { status: 404 }
      );
    }

    await prisma.resource.delete({
      where: { id: params.id },
      include: {
        links: true, // Include links to ensure they are cascaded
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除资源失败:', error);
    return NextResponse.json(
      { error: '删除资源失败' },
      { status: 500 }
    );
  }
}

// PUT /api/resources/[id]
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

    let data;
    try {
      data = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: '无效的请求数据' },
        { status: 400 }
      );
    }

    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { error: '无效的请求数据格式' },
        { status: 400 }
      );
    }

    const { title, description, url, size, categories, tags, links } = data;

    if (!title || !description || !url || !Array.isArray(categories) || !Array.isArray(tags)) {
      return NextResponse.json(
        { error: '缺少必要的字段' },
        { status: 400 }
      );
    }

    // 更新资源
    const existingResource = await prisma.resource.findUnique({
      where: { id: params.id },
      include: {
        categories: true,
        tags: true,
        links: true,
      },
    });

    if (!existingResource) {
      return NextResponse.json(
        { error: '资源不存在' },
        { status: 404 }
      );
    }

    // 1. 在事务中完成所有更新操作
    const updatedResource = await prisma.$transaction(async (tx) => {
      // 删除现有的关联
      await tx.resource.update({
        where: { id: params.id },
        data: {
          categories: {
            disconnect: existingResource.categories.map(c => ({ name: c.name })),
          },
        },
      });

      await tx.resource.update({
        where: { id: params.id },
        data: {
          tags: {
            disconnect: existingResource.tags.map(t => ({ name: t.name })),
          },
        },
      });

      await tx.resourceLink.deleteMany({
        where: {
          resourceId: params.id,
        },
      });

      // 更新资源并创建新的关联
      return tx.resource.update({
        where: { id: params.id },
        data: {
          title,
          description,
          url,
          size: size || undefined,
          categories: {
            connectOrCreate: categories.map((category: { name: string }) => ({
              where: { name: category.name },
              create: { name: category.name },
            })),
          },
          tags: {
            connectOrCreate: tags.map((tag: { name: string }) => ({
              where: { name: tag.name },
              create: { name: tag.name },
            })),
          },
          links: {
            create: Array.isArray(links) ? links : [],
          },
        },
        include: {
          categories: true,
          tags: true,
          links: true,
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          favorites: true,
        },
      });
    });

    // 格式化响应数据
    const formattedResource = {
      ...updatedResource,
      favoritesCount: updatedResource.favorites.length,
      isFavorite: updatedResource.favorites.some(f => f.userId === session.user.id),
    };

    // 清除缓存
    await Promise.all([
      resourceCache.delete('resources:*'), // 清除所有资源列表缓存
      resourceCache.delete(`resource:${params.id}`), // 清除单个资源缓存
      resourceCache.delete(`favorites:${session.user.id}:*`), // 清除用户收藏缓存
    ]);

    return NextResponse.json(formattedResource);
  } catch (error) {
    console.error('更新资源失败:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: '更新资源失败' },
      { status: 500 }
    );
  }
}

// PATCH /api/resources/[id]
export async function PATCH(request: Request, props: Props) {
  const params = await props.params;

  try {
    const client = await initializePrisma();
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const resourceId = params.id;
    const { favorite } = await request.json();

    // 检查资源是否存在，同时获取收藏状态
    const resource = await client.resource.findUnique({
      where: { id: resourceId },
      include: {
        favorites: {
          where: { userId },
          select: { id: true },
        },
      },
    });

    if (!resource) {
      return NextResponse.json(
        { error: '资源不存在' },
        { status: 404 }
      );
    }

    const isFavorited = resource.favorites.length > 0;
    let result;

    if (favorite === isFavorited) {
      return NextResponse.json({
        isFavorite: isFavorited,
        message: isFavorited ? '已经在收藏中' : '已经取消收藏'
      });
    }

    if (!favorite) {
      // 取消收藏
      result = await client.favorite.deleteMany({
        where: {
          userId,
          resourceId,
        },
      });

      if (result.count === 0) {
        return NextResponse.json(
          { error: '取消收藏失败' },
          { status: 500 }
        );
      }
    } else {
      // 添加收藏
      result = await client.favorite.create({
        data: {
          userId,
          resourceId,
        },
      });

      if (!result) {
        return NextResponse.json(
          { error: '添加收藏失败' },
          { status: 500 }
        );
      }
    }

    // 清除相关缓存
    await Promise.all([
      resourceCache.delete('resources:*'),  // 清除所有资源列表缓存
      resourceCache.delete(`resource:${resourceId}`),  // 清除单个资源缓存
      resourceCache.delete(`favorites:${userId}:*`),  // 清除用户收藏缓存
    ]);

    return NextResponse.json({
      success: true,
      isFavorite: favorite,
      message: favorite ? '已添加到收藏' : '已取消收藏'
    });
  } catch (error) {
    console.error('更新收藏状态失败:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: '更新收藏状态失败' },
      { status: 500 }
    );
  }
}
