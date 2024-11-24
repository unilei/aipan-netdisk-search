import { cache } from 'react';
import { prisma, initializePrisma } from '@/lib/prisma-client';

// 缓存分类和标签查询
export const getCategories = cache(async () => {
  await initializePrisma();
  return prisma.category.findMany({
    select: {
      id: true,
      name: true,
    },
  });
});

export const getTags = cache(async () => {
  await initializePrisma();
  return prisma.tag.findMany({
    select: {
      id: true,
      name: true,
    },
  });
});
