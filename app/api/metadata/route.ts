import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma, initializePrisma } from '@/lib/prisma-client';
import { metadataCache } from '@/lib/cache';

export async function GET() {
  try {
    await initializePrisma();
    
    const session = await getServerSession(authOptions);

    const [categories, tags] = await Promise.all([
      metadataCache.get('categories', async () => {
        return prisma.category.findMany({
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                resources: true
              }
            }
          },
          orderBy: {
            name: 'asc'
          }
        });
      }),
      metadataCache.get('tags', async () => {
        return prisma.tag.findMany({
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                resources: true
              }
            }
          },
          orderBy: {
            name: 'asc'
          }
        });
      })
    ]);

    return NextResponse.json({
      categories: categories.map(c => ({
        id: c.id,
        name: c.name,
        count: c._count.resources
      })),
      tags: tags.map(t => ({
        id: t.id,
        name: t.name,
        count: t._count.resources
      })),
      cacheStats: metadataCache.getStats()
    });
  } catch (error) {
    console.error('获取元数据失败:', error);
    return NextResponse.json(
      { error: '获取元数据失败' },
      { status: 500 }
    );
  }
}
