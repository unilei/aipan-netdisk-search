import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma, initializePrisma } from '@/lib/prisma-client';

// GET /api/stats
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      );
    }

    await initializePrisma();
    
    // 串行获取统计数据
    const resourceCount = await prisma.resource.count();
    const categoryCount = await prisma.category.count();
    const tagCount = await prisma.tag.count();
    const userCount = await prisma.user.count();

    return NextResponse.json({
      resourceCount,
      categoryCount,
      tagCount,
      userCount,
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    return NextResponse.json(
      { error: '获取统计数据失败' },
      { status: 500 }
    );
  }
}
