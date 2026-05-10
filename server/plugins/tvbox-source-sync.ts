import {
  getTvboxSourceSummary,
  shouldSyncTvboxSources,
  syncTvboxSourcesToDatabase,
} from "~/server/services/tvbox/store.mjs";
import {
  DEFAULT_TVBOX_SYNC_TIME,
  getDelayUntilNextDailySync,
} from "~/server/services/tvbox/scheduler.mjs";

let schedulerStarted = false;
let syncTimer: NodeJS.Timeout | null = null;

const isSyncEnabled = () => process.env.TVBOX_SYNC_ENABLED !== "false";

const getSyncTime = () => process.env.TVBOX_SYNC_TIME || DEFAULT_TVBOX_SYNC_TIME;

const scheduleTimer = (callback: () => void, delay: number) => {
  const timer = setTimeout(callback, delay);
  timer.unref?.();
  return timer;
};

export default defineNitroPlugin(() => {
  if (!process.server || schedulerStarted || !isSyncEnabled()) {
    return;
  }

  schedulerStarted = true;

  const runSync = async (reason: "startup" | "scheduled") => {
    try {
      const result = await syncTvboxSourcesToDatabase({ fetcher: $fetch });
      const stored = result.meta.database?.stored || 0;
      const activeTotal = result.meta.database?.summary?.activeTotal || 0;
      console.log(
        `TVBox 数据源${reason === "startup" ? "启动" : "定时"}同步完成：写入 ${stored} 条，当前有效 ${activeTotal} 条`,
      );
    } catch (error) {
      console.error("TVBox 数据源同步失败:", error);
    }
  };

  const scheduleNextSync = () => {
    const delay = getDelayUntilNextDailySync(new Date(), getSyncTime());
    syncTimer = scheduleTimer(async () => {
      await runSync("scheduled");
      scheduleNextSync();
    }, delay);
  };

  scheduleNextSync();

  getTvboxSourceSummary()
    .then((summary) => {
      if (shouldSyncTvboxSources(summary)) {
        syncTimer = scheduleTimer(() => {
          runSync("startup");
        }, 5000);
      }
    })
    .catch((error) => {
      console.error("读取 TVBox 数据源同步状态失败:", error);
    });
});
