// server/api/resources/get.js
import prisma from '~/lib/prisma';

export default defineEventHandler(async (event) => {
  const query = await getQuery(event);
  const page = Number(query.page) || 1;
  const pageSize = Number(query.pageSize) || 10;
  const skip = (page - 1) * pageSize;
  const take = pageSize;
  // 获取总记录数
  const totalCount = await prisma.resource.count();
  const resources = await prisma.resource.findMany({
    skip,
    take,
    include: {
      creator: {
        select: { username: true }, // 包含创建者的用户名
      },
      type: {
        select: { name: true }, // 包含资源类型的名称
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return {
    totalCount,
    page,
    pageSize,
    resources,
  };
});
