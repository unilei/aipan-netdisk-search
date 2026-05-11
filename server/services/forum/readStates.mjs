const toPositiveInt = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const normalizeDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const getPrismaClient = async (prismaClient) => {
  if (prismaClient) return prismaClient;
  const module = await import("../../../lib/prisma.js");
  return module.default;
};

export const uniqueForumParticipantIds = ({
  topicAuthorId,
  postAuthorIds = [],
  actorId,
}) => {
  const actor = toPositiveInt(actorId);
  const seen = new Set();
  const result = [];

  for (const value of [topicAuthorId, ...postAuthorIds]) {
    const userId = toPositiveInt(value);
    if (!userId || userId === actor || seen.has(userId)) continue;
    seen.add(userId);
    result.push(userId);
  }

  return result;
};

export const buildForumNewReplyPayload = ({
  topic,
  post,
  readState,
  authorUsername,
}) => ({
  topicId: topic.id,
  slug: topic.slug,
  title: topic.title,
  postId: post.id,
  unreadCount: readState?.unreadCount || 0,
  lastUnreadAt: normalizeDate(readState?.lastUnreadAt),
  authorUsername: authorUsername || "用户",
});

export const attachViewerStatesToTopics = async (
  topics,
  userId,
  prismaClient,
) => {
  const viewerId = toPositiveInt(userId);
  if (!viewerId || !Array.isArray(topics) || topics.length === 0) {
    return topics;
  }

  const prisma = await getPrismaClient(prismaClient);
  const topicIds = topics
    .map((topic) => toPositiveInt(topic?.id))
    .filter(Boolean);

  if (topicIds.length === 0) {
    return topics;
  }

  const readStates = await prisma.forumTopicReadState.findMany({
    where: {
      userId: viewerId,
      topicId: { in: topicIds },
    },
    select: {
      topicId: true,
      unreadCount: true,
      lastUnreadAt: true,
    },
  });

  const stateByTopicId = new Map(
    readStates.map((state) => [state.topicId, state]),
  );

  return topics.map((topic) => {
    const state = stateByTopicId.get(topic.id);
    const unreadCount = state?.unreadCount || 0;

    return {
      ...topic,
      viewerState: {
        hasUnread: unreadCount > 0,
        unreadCount,
        lastUnreadAt: normalizeDate(state?.lastUnreadAt),
      },
    };
  });
};

export const markForumTopicRead = async ({
  userId,
  topicId,
  readAt = new Date(),
  prismaClient,
}) => {
  const viewerId = toPositiveInt(userId);
  const targetTopicId = toPositiveInt(topicId);
  if (!viewerId || !targetTopicId) return null;

  const prisma = await getPrismaClient(prismaClient);

  return prisma.forumTopicReadState.upsert({
    where: {
      userId_topicId: {
        userId: viewerId,
        topicId: targetTopicId,
      },
    },
    create: {
      userId: viewerId,
      topicId: targetTopicId,
      lastReadAt: readAt,
      unreadCount: 0,
      lastUnreadPostId: null,
      lastUnreadAt: null,
    },
    update: {
      lastReadAt: readAt,
      unreadCount: 0,
      lastUnreadPostId: null,
      lastUnreadAt: null,
    },
  });
};

export const markAllParticipatingForumTopicsRead = async ({
  userId,
  readAt = new Date(),
  prismaClient,
}) => {
  const viewerId = toPositiveInt(userId);
  if (!viewerId) return { count: 0 };

  const prisma = await getPrismaClient(prismaClient);

  return prisma.forumTopicReadState.updateMany({
    where: {
      userId: viewerId,
      unreadCount: { gt: 0 },
    },
    data: {
      lastReadAt: readAt,
      unreadCount: 0,
      lastUnreadPostId: null,
      lastUnreadAt: null,
    },
  });
};

export const getForumUnreadSummary = async ({
  userId,
  limit = 5,
  prismaClient,
}) => {
  const viewerId = toPositiveInt(userId);
  if (!viewerId) {
    return {
      unreadTopicCount: 0,
      unreadReplyCount: 0,
      topics: [],
    };
  }

  const prisma = await getPrismaClient(prismaClient);
  const where = {
    userId: viewerId,
    unreadCount: { gt: 0 },
  };

  const [aggregate, readStates] = await Promise.all([
    prisma.forumTopicReadState.aggregate({
      where,
      _count: { _all: true },
      _sum: { unreadCount: true },
    }),
    prisma.forumTopicReadState.findMany({
      where,
      orderBy: [{ lastUnreadAt: "desc" }, { updatedAt: "desc" }],
      take: Math.max(1, Math.min(Number(limit) || 5, 20)),
      include: {
        topic: {
          select: {
            id: true,
            slug: true,
            title: true,
            lastActivityAt: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        lastUnreadPost: {
          select: {
            id: true,
            author: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    }),
  ]);

  return {
    unreadTopicCount: aggregate._count?._all || 0,
    unreadReplyCount: aggregate._sum?.unreadCount || 0,
    topics: readStates.map((state) => ({
      id: state.topic.id,
      slug: state.topic.slug,
      title: state.topic.title,
      category: state.topic.category,
      unreadCount: state.unreadCount,
      lastUnreadAt: normalizeDate(state.lastUnreadAt),
      lastActivityAt: normalizeDate(state.topic.lastActivityAt),
      lastUnreadPostId: state.lastUnreadPostId,
      authorUsername: state.lastUnreadPost?.author?.username || null,
    })),
  };
};

export const updateForumReadStatesForApprovedReply = async ({
  topic,
  post,
  actorId,
  authorUsername,
  prismaClient,
}) => {
  const prisma = await getPrismaClient(prismaClient);
  const topicId = toPositiveInt(topic?.id);
  const replyAuthorId = toPositiveInt(actorId);
  if (!topicId || !replyAuthorId) return [];

  const readAt = post?.createdAt ? new Date(post.createdAt) : new Date();
  const participantPosts = await prisma.forumPost.findMany({
    where: {
      topicId,
      status: "approved",
    },
    select: {
      authorId: true,
    },
  });

  const participantIds = uniqueForumParticipantIds({
    topicAuthorId: topic.authorId,
    postAuthorIds: participantPosts.map((item) => item.authorId),
    actorId: replyAuthorId,
  });

  await markForumTopicRead({
    userId: replyAuthorId,
    topicId,
    readAt,
    prismaClient: prisma,
  });

  return Promise.all(
    participantIds.map(async (userId) => {
      const readState = await prisma.forumTopicReadState.upsert({
        where: {
          userId_topicId: {
            userId,
            topicId,
          },
        },
        create: {
          userId,
          topicId,
          lastReadAt: null,
          unreadCount: 1,
          lastUnreadPostId: post.id,
          lastUnreadAt: readAt,
        },
        update: {
          unreadCount: { increment: 1 },
          lastUnreadPostId: post.id,
          lastUnreadAt: readAt,
        },
      });

      return {
        userId,
        readState,
        payload: buildForumNewReplyPayload({
          topic,
          post,
          readState,
          authorUsername,
        }),
      };
    }),
  );
};
