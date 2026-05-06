import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  const id = Number.parseInt(event.context.params?.id || "", 10);

  if (!Number.isFinite(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      message: "Invalid comment ID",
    });
  }

  try {
    await prisma.comment.deleteMany({
      where: {
        OR: [
          { id },
          { parentId: id },
        ],
      },
    });

    return {
      code: 200,
      message: "Comment deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting admin comment:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      message: "Failed to delete comment",
    });
  }
});
