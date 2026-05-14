export const FORUM_TOPIC_PUBLIC_STATUS = "approved";
export const FORUM_TOPIC_TRASHED_STATUS = "trashed";
export const FORUM_TOPIC_STATUSES = [
  "pending",
  FORUM_TOPIC_PUBLIC_STATUS,
  "rejected",
  FORUM_TOPIC_TRASHED_STATUS,
];

const toPositiveInt = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const normalizeReason = (value) => {
  const text = String(value || "").trim();
  return text ? text.slice(0, 1000) : null;
};

const statusBeforeTrash = (topic) => {
  if (!topic) return FORUM_TOPIC_PUBLIC_STATUS;
  if (topic.status && topic.status !== FORUM_TOPIC_TRASHED_STATUS) {
    return topic.status;
  }
  return topic.statusBeforeTrash || FORUM_TOPIC_PUBLIC_STATUS;
};

const buildServiceError = ({ statusCode, statusMessage }) =>
  Object.assign(new Error(statusMessage), {
    statusCode,
    statusMessage,
  });

export const isForumTopicPubliclyVisible = (topic) =>
  topic?.status === FORUM_TOPIC_PUBLIC_STATUS;

export const isForumTopicTrashed = (topic) =>
  topic?.status === FORUM_TOPIC_TRASHED_STATUS;

export const buildForumTopicTrashUpdate = ({
  topic,
  actorId,
  reason,
  now = new Date(),
}) => ({
  status: FORUM_TOPIC_TRASHED_STATUS,
  statusBeforeTrash: statusBeforeTrash(topic),
  trashedAt: now,
  trashedById: toPositiveInt(actorId),
  trashReason: normalizeReason(reason),
});

export const buildForumTopicRestoreUpdate = (topic = {}) => ({
  status: topic.statusBeforeTrash || FORUM_TOPIC_PUBLIC_STATUS,
  statusBeforeTrash: null,
  trashedAt: null,
  trashedById: null,
  trashReason: null,
});

export const buildPublicForumTopicWhere = (where = {}) => ({
  ...where,
  status: FORUM_TOPIC_PUBLIC_STATUS,
});

export const moveForumTopicToTrash = async ({
  topicId,
  actorId,
  reason,
  prismaClient,
  now = new Date(),
}) => {
  const id = toPositiveInt(topicId);
  if (!id) {
    throw buildServiceError({ statusCode: 400, statusMessage: "无效的主题ID" });
  }

  const topic = await prismaClient.forumTopic.findUnique({ where: { id } });
  if (!topic) {
    throw buildServiceError({ statusCode: 404, statusMessage: "主题不存在" });
  }

  if (isForumTopicTrashed(topic)) {
    return topic;
  }

  return prismaClient.forumTopic.update({
    where: { id },
    data: buildForumTopicTrashUpdate({
      topic,
      actorId,
      reason,
      now,
    }),
  });
};

export const restoreForumTopicFromTrash = async ({
  topicId,
  prismaClient,
}) => {
  const id = toPositiveInt(topicId);
  if (!id) {
    throw buildServiceError({ statusCode: 400, statusMessage: "无效的主题ID" });
  }

  const topic = await prismaClient.forumTopic.findUnique({ where: { id } });
  if (!topic) {
    throw buildServiceError({ statusCode: 404, statusMessage: "主题不存在" });
  }

  if (!isForumTopicTrashed(topic)) {
    return topic;
  }

  return prismaClient.forumTopic.update({
    where: { id },
    data: buildForumTopicRestoreUpdate(topic),
  });
};
