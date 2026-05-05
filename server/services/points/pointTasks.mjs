export const POINT_TASK_DEFAULTS = {
  points: 100,
  enabled: true,
  sortOrder: 0,
  claimLimit: 1,
};

export const POINT_TASK_LIMITS = {
  titleMaxLength: 80,
  descriptionMaxLength: 300,
  keyMaxLength: 80,
  maxPoints: 100000000,
  maxClaimLimit: 10,
};

const normalizeString = (value) => String(value || "").trim();

const normalizeInteger = (value, fallback, min, max) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, min), max);
};

export const normalizePointTaskKey = (value) =>
  normalizeString(value)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, POINT_TASK_LIMITS.keyMaxLength);

export const buildPointTaskKey = ({ title, seed = Date.now() }) => {
  const normalizedTitle = normalizePointTaskKey(title);
  const suffix = Number(seed).toString(36);
  return normalizePointTaskKey(`${normalizedTitle || "point-task"}-${suffix}`);
};

export const validatePointTaskUrl = (value) => {
  const url = normalizeString(value);
  if (!url) {
    throw new Error("任务链接不能为空");
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("任务链接格式不正确");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("任务链接只支持 http 或 https");
  }

  return parsed.toString();
};

export const normalizePointTaskInput = (input = {}, options = {}) => {
  const title = normalizeString(input.title);
  if (!title) {
    throw new Error("任务标题不能为空");
  }
  if (title.length > POINT_TASK_LIMITS.titleMaxLength) {
    throw new Error(`任务标题不能超过 ${POINT_TASK_LIMITS.titleMaxLength} 个字符`);
  }

  const description = normalizeString(input.description);
  if (description.length > POINT_TASK_LIMITS.descriptionMaxLength) {
    throw new Error(`任务说明不能超过 ${POINT_TASK_LIMITS.descriptionMaxLength} 个字符`);
  }

  const url = validatePointTaskUrl(input.url);
  const points = normalizeInteger(
    input.points,
    POINT_TASK_DEFAULTS.points,
    1,
    POINT_TASK_LIMITS.maxPoints,
  );
  const sortOrder = normalizeInteger(input.sortOrder, POINT_TASK_DEFAULTS.sortOrder, -1000000, 1000000);
  const claimLimit = normalizeInteger(
    input.claimLimit,
    POINT_TASK_DEFAULTS.claimLimit,
    1,
    POINT_TASK_LIMITS.maxClaimLimit,
  );
  const key = options.existingKey || normalizePointTaskKey(input.key) || buildPointTaskKey({ title });

  return {
    key,
    title,
    description,
    url,
    points,
    enabled: input.enabled === undefined ? POINT_TASK_DEFAULTS.enabled : Boolean(input.enabled),
    sortOrder,
    claimLimit,
  };
};

export const resolvePointTaskClaimDecision = ({
  task,
  completedCount = 0,
}) => {
  if (!task) {
    return {
      claimable: false,
      reason: "not_found",
      message: "任务不存在",
    };
  }

  if (!task.enabled) {
    return {
      claimable: false,
      reason: "disabled",
      message: "任务已关闭",
    };
  }

  const claimLimit = normalizeInteger(task.claimLimit, POINT_TASK_DEFAULTS.claimLimit, 1, POINT_TASK_LIMITS.maxClaimLimit);
  const count = normalizeInteger(completedCount, 0, 0, POINT_TASK_LIMITS.maxClaimLimit);

  if (count >= claimLimit) {
    return {
      claimable: false,
      reason: "already_claimed",
      message: "该任务奖励已领取",
    };
  }

  return {
    claimable: true,
    reason: "claimable",
    message: "",
    claimNo: count + 1,
    remainingClaims: claimLimit - count,
  };
};

export const toUserPointTask = ({ task, completedCount = 0 }) => {
  const decision = resolvePointTaskClaimDecision({ task, completedCount });

  return {
    id: task.id,
    key: task.key,
    title: task.title,
    description: task.description || "",
    url: task.url,
    points: task.points,
    enabled: task.enabled,
    sortOrder: task.sortOrder,
    claimLimit: task.claimLimit,
    completedCount,
    canClaim: decision.claimable,
    status: decision.reason === "already_claimed" ? "completed" : decision.reason,
  };
};
