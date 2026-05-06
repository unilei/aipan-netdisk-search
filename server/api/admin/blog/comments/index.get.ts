import prisma from "~/lib/prisma";
import {
  buildAdminCommentWhere,
  normalizeAdminCommentListQuery,
  toAdminCommentListItem,
} from "~/server/services/blog/adminComments.mjs";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const { page, pageSize, keyword, searchType } = normalizeAdminCommentListQuery(query);
  const where = buildAdminCommentWhere({ keyword, searchType });

  try {
    const [total, comments] = await Promise.all([
      prisma.comment.count({ where }),
      prisma.comment.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          post: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      }),
    ]);

    return {
      code: 200,
      message: "Comments retrieved successfully",
      data: {
        comments: comments.map(toAdminCommentListItem),
        total,
        page,
        pageSize,
      },
    };
  } catch (error) {
    console.error("Error fetching admin comments:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      message: "Failed to fetch comments",
    });
  }
});
