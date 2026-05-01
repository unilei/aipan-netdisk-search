import prisma from "~/lib/prisma";

type LeaderboardRow = {
  id: number;
  username: string;
  avatarStyle: string | null;
  permanentPoints: number;
  temporaryPoints: number;
  effectivePoints: number;
  nextExpiringAt: Date | null;
  rank: number | bigint;
};

const normalizeLeaderboardRow = (row: LeaderboardRow, currentUserId: number) => ({
  id: row.id,
  username: row.username,
  avatarStyle: row.avatarStyle,
  permanentPoints: Number(row.permanentPoints || 0),
  temporaryPoints: Number(row.temporaryPoints || 0),
  effectivePoints: Number(row.effectivePoints || 0),
  nextExpiringAt: row.nextExpiringAt,
  rank: Number(row.rank || 0),
  isCurrentUser: row.id === currentUserId,
});

export default defineEventHandler(async (event) => {
  if (!event.context.user?.userId) {
    throw createError({
      statusCode: 401,
      message: "请先登录",
    });
  }

  const currentUserId = Number(event.context.user.userId);
  const query = getQuery(event);
  const limit = Math.min(100, Math.max(10, Number(query.limit) || 50));

  try {
    const leaderboardRows = await prisma.$queryRaw<LeaderboardRow[]>`
      WITH ranked_users AS (
        SELECT
          u.id,
          u.username,
          u."avatarStyle",
          u.points::int AS "permanentPoints",
          COALESCE(SUM(ph.points), 0)::int AS "temporaryPoints",
          (u.points + COALESCE(SUM(ph.points), 0))::int AS "effectivePoints",
          MIN(ph."expiresAt") AS "nextExpiringAt",
          ROW_NUMBER() OVER (
            ORDER BY
              (u.points + COALESCE(SUM(ph.points), 0)) DESC,
              u.points DESC,
              u."createdAt" ASC,
              u.id ASC
          ) AS rank
        FROM "User" u
        LEFT JOIN "PointsHistory" ph
          ON ph."userId" = u.id
          AND ph.points > 0
          AND ph."expiresAt" > NOW()
        WHERE u.status = 'active'
        GROUP BY u.id
      )
      SELECT *
      FROM ranked_users
      ORDER BY rank ASC
      LIMIT ${limit}
    `;

    const currentUserRows = await prisma.$queryRaw<LeaderboardRow[]>`
      WITH ranked_users AS (
        SELECT
          u.id,
          u.username,
          u."avatarStyle",
          u.points::int AS "permanentPoints",
          COALESCE(SUM(ph.points), 0)::int AS "temporaryPoints",
          (u.points + COALESCE(SUM(ph.points), 0))::int AS "effectivePoints",
          MIN(ph."expiresAt") AS "nextExpiringAt",
          ROW_NUMBER() OVER (
            ORDER BY
              (u.points + COALESCE(SUM(ph.points), 0)) DESC,
              u.points DESC,
              u."createdAt" ASC,
              u.id ASC
          ) AS rank
        FROM "User" u
        LEFT JOIN "PointsHistory" ph
          ON ph."userId" = u.id
          AND ph.points > 0
          AND ph."expiresAt" > NOW()
        WHERE u.status = 'active'
        GROUP BY u.id
      )
      SELECT *
      FROM ranked_users
      WHERE id = ${currentUserId}
      LIMIT 1
    `;

    const totalUsers = await prisma.user.count({
      where: {
        status: "active",
      },
    });

    return {
      code: 200,
      msg: "success",
      data: {
        leaderboard: leaderboardRows.map((row) =>
          normalizeLeaderboardRow(row, currentUserId),
        ),
        currentUser: currentUserRows[0]
          ? normalizeLeaderboardRow(currentUserRows[0], currentUserId)
          : null,
        totalUsers,
        limit,
      },
    };
  } catch (error: any) {
    console.error("获取积分排行榜失败:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "获取积分排行榜失败",
    });
  }
});
