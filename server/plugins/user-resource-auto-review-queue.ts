import { autoReviewUserResource } from "~/server/services/userResources/autoReviewRunner.js";
import { startUserResourceAutoReviewWorker } from "~/server/services/userResources/autoReviewQueue.js";

let workerStarted = false;

export default defineNitroPlugin(() => {
  if (!process.server || workerStarted) {
    return;
  }

  workerStarted = startUserResourceAutoReviewWorker(autoReviewUserResource);

  if (workerStarted) {
    console.log("用户资源自动审核队列 worker 已启动");
  }
});
