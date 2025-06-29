// 搜索队列管理 composable
export const useSearchQueue = () => {
  const { saveToQuarkAsync } = useQuarkConfig();

  // 简化队列状态
  const queueState = reactive({
    successCount: 0,
    isProcessing: false,
    tasks: [],
    errorCount: 0
  });

  // 队列处理定时器
  let queueTimer = null;

  // 简化队列处理 - 避免递归调用
  const processQueue = async () => {
    if (queueState.isProcessing || queueState.tasks.length === 0 || queueState.successCount >= 5) {
      return;
    }

    queueState.isProcessing = true;

    try {
      const task = queueState.tasks[0];
      await new Promise(resolve => setTimeout(resolve, 3000));

      const success = await saveToQuarkAsync(task.link, task.name);
      if (success) {
        queueState.successCount++;
      } else {
        queueState.errorCount++;
      }

      queueState.tasks.shift();
    } catch (error) {
      console.error("Queue processing error:", {
        error: error.message || error,
        taskCount: queueState.tasks.length,
        successCount: queueState.successCount,
        errorCount: queueState.errorCount,
        timestamp: new Date().toISOString()
      });
      queueState.errorCount++;
    } finally {
      queueState.isProcessing = false;

      // 使用定时器避免递归调用栈溢出
      if (queueState.tasks.length > 0 && queueState.successCount < 5) {
        queueTimer = setTimeout(() => {
          processQueue();
        }, 100);
      }
    }
  };

  // 停止队列处理
  const stopQueueProcessing = () => {
    if (queueTimer) {
      clearTimeout(queueTimer);
      queueTimer = null;
    }
    queueState.isProcessing = false;
  };

  // 添加任务到队列
  const addToQueue = (link, name) => {
    queueState.tasks.push({ link, name });
    if (!queueState.isProcessing) {
      processQueue();
    }
  };

  // 清空队列
  const clearQueue = () => {
    queueState.tasks = [];
    queueState.successCount = 0;
    queueState.errorCount = 0;
    stopQueueProcessing();
  };

  return {
    queueState,
    processQueue,
    stopQueueProcessing,
    addToQueue,
    clearQueue
  };
};
