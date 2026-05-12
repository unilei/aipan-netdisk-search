import prisma from '~/lib/prisma';
import {
  getAlistSourceSelect,
  toAdminAlistSource,
} from "~/server/services/alist/records";

export default defineEventHandler(async (event) => {
  const query = await getQuery(event);
  const page = Number(query.page) || 1;
  const pageSize = Number(query.pageSize) || 10;
  const skip = (page - 1) * pageSize;
  const take = pageSize;
  // 获取总记录数
  const totalCount = await prisma.alist.count();
  const alists = await prisma.alist.findMany({
    skip,
    take,
    select: getAlistSourceSelect(),
    orderBy: {
      createdAt: 'desc',
    },
  });

  return {
    totalCount,
    page,
    pageSize,
    alists: alists.map(toAdminAlistSource),
  };
});
