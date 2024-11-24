import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma, initializePrisma } from '@/lib/prisma-client';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    await initializePrisma();
    
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    return NextResponse.json(session.user);
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return NextResponse.json(
      { error: '获取用户信息失败' },
      { status: 500 }
    );
  }
}
