export const DEFAULT_TVBOX_SYNC_TIME = "03:20";
export const TVBOX_SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;

const clampInteger = (value, min, max, fallback) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

export const parseDailySyncTime = (value = DEFAULT_TVBOX_SYNC_TIME) => {
  const match = String(value || "").trim().match(/^(\d{1,2})(?::(\d{1,2}))?$/);
  if (!match) {
    return parseDailySyncTime(DEFAULT_TVBOX_SYNC_TIME);
  }

  return {
    hour: clampInteger(match[1], 0, 23, 3),
    minute: clampInteger(match[2] ?? 0, 0, 59, 20),
  };
};

export const getNextDailySyncAt = (
  now = new Date(),
  syncTime = DEFAULT_TVBOX_SYNC_TIME,
) => {
  const { hour, minute } = parseDailySyncTime(syncTime);
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);

  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }

  return next;
};

export const getDelayUntilNextDailySync = (
  now = new Date(),
  syncTime = DEFAULT_TVBOX_SYNC_TIME,
) => {
  return Math.max(1000, getNextDailySyncAt(now, syncTime).getTime() - now.getTime());
};
