// 搜索逻辑管理 composable
export const useSearchLogic = () => {
  const { smartCache } = useSmartCache();
  const { quarkConfig } = useQuarkConfig();
  const { queueState, processQueue } = useSearchQueue();

  // 请求去重管理
  let currentSearchController = null;
  let currentVodSearches = new Map();

  // 队列管理
  let queue = [];
  let running = 0;
  const maxConcurrent = 3;

  // 运行队列
  const runQueue = () => {
    while (running < maxConcurrent && queue.length > 0) {
      const task = queue.shift();
      running++;
      task().finally(() => {
        running--;
        runQueue();
      });
    }
  };

  // 带重试的请求函数
  const fetchWithRetry = async (url, options = {}, maxRetries = 3) => {
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await $fetch(url, {
          ...options,
          timeout: 15000,
        });
        return response;
      } catch (error) {
        lastError = error;
        if (i < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
    }

    throw lastError;
  };

  // 处理单个搜索
  const handleSingleSearch = async (
    item,
    keyword,
    sources,
    loadingProgress
  ) => {
    const encodedKeyword = encodeURIComponent(keyword.trim());
    const cacheKey = `${item.api}-${encodedKeyword}`;

    const task = async () => {
      try {
        // 尝试从缓存获取
        const cachedData = await smartCache.getWithStrategy(cacheKey);

        if (cachedData) {
          if (item.api === "/api/sources/aipan-search") {
            sources.value.unshift(...cachedData);
            if (cachedData.length === 0) {
              window._needProcessQuarkLinks = true;
            }
          } else {
            sources.value.push(...cachedData);
          }
          loadingProgress.value.completed++;
          return;
        }

        // 缓存未命中，从API获取
        const res = await fetchWithRetry(item.api, {
          method: "POST",
          body: { name: keyword },
        });

        if (res.list && Array.isArray(res.list)) {
          // 设置缓存
          await smartCache.setWithStrategy(cacheKey, res.list, "search");

          if (item.api === "/api/sources/aipan-search") {
            sources.value.unshift(...res.list);
            if (res.list.length === 0) {
              window._needProcessQuarkLinks = true;
            }
          } else if (
            window._needProcessQuarkLinks &&
            quarkConfig.value.enabled
          ) {
            sources.value.push(...res.list);

            // 重置队列状态
            queueState.successCount = 0;
            queueState.isProcessing = false;
            queueState.tasks = [];
            queueState.errorCount = 0;

            // 添加夸克链接到队列
            res.list.forEach((result) => {
              const links = result.links.filter(
                (link) => link.service === "QUARK"
              );
              links.forEach((link) => {
                queueState.tasks.push({
                  link: link.link,
                  name: result.name,
                });
              });
            });

            // 处理队列
            processQueue();
          } else {
            sources.value.push(...res.list);
          }
        }
      } catch (err) {
        console.error(`搜索失败 ${item.api}:`, {
          error: err.message || err,
          api: item.api,
          keyword: keyword,
          timestamp: new Date().toISOString(),
        });
      } finally {
        loadingProgress.value.completed++;
        if (loadingProgress.value.completed >= loadingProgress.value.total) {
          loadingProgress.value.isLoading = false;
          delete window._needProcessQuarkLinks;
        }
      }
    };

    queue.push(task);
    runQueue();
  };

  // 处理单个VOD搜索
  const handleSingleVodSearch = async (
    vodApi,
    keyword,
    vodData,
    loadingStatus
  ) => {
    const encodedKeyword = encodeURIComponent(keyword.trim());
    const cacheKey = `vod-${vodApi.api}-${
      vodApi.type || "default"
    }-${encodedKeyword}`;

    // 取消之前的VOD搜索请求
    if (currentVodSearches.has(vodApi.api)) {
      currentVodSearches.get(vodApi.api).abort();
    }

    const controller = new AbortController();
    currentVodSearches.set(vodApi.api, controller);
    loadingStatus.value.set(vodApi.api, true);

    try {
      // 尝试从缓存获取
      const cachedData = await smartCache.getWithStrategy(cacheKey);
      if (cachedData) {
        vodData.value = [...vodData.value, ...cachedData];
        loadingStatus.value.set(vodApi.api, false);
        return;
      }

      // 从API获取数据
      const res = await fetchWithRetry("/api/vod/search", {
        method: "get",
        query: {
          type: vodApi.type,
          api: vodApi.api,
          ac: "detail",
          wd: keyword,
        },
        signal: controller.signal,
      });

      // 改进的响应验证和错误处理
      if (res && typeof res === "object") {
        if (
          res.code === 1 &&
          res.list &&
          Array.isArray(res.list) &&
          res.list.length > 0
        ) {
          // 验证每个item的基本结构
          const validItems = res.list.filter(
            (item) =>
              item && typeof item === "object" && (item.vod_name || item.title)
          );

          if (validItems.length > 0) {
            const processedData = validItems.map((item) =>
              Object.assign(
                { playUrl: vodApi.playUrl, sourceName: vodApi.name },
                item
              )
            );
            // 设置缓存
            await smartCache.setWithStrategy(cacheKey, processedData, "vod");
            vodData.value = [...vodData.value, ...processedData];
          }
        } else if (res.code !== 200) {
          console.warn(
            `VOD API返回错误状态: ${vodApi.api}, code: ${res.code}, message: ${
              res.msg || "未知错误"
            }`
          );
        }
      } else {
        console.warn(`VOD API返回无效响应: ${vodApi.api}`);
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error(`VOD获取失败: ${vodApi.api}`, {
          error: err.message || err,
          vodApi: vodApi.name,
          keyword: keyword,
          timestamp: new Date().toISOString(),
        });
      }
    } finally {
      loadingStatus.value.set(vodApi.api, false);
      currentVodSearches.delete(vodApi.api);
    }
  };

  // 处理搜索函数
  const handleSearch = async (
    keyword,
    sources,
    loadingProgress,
    sourcesApiEndpoints
  ) => {
    if (!keyword || keyword.trim() === "") {
      sources.value = [];
      return;
    }

    // 取消之前的搜索请求
    if (currentSearchController) {
      currentSearchController.abort();
    }

    currentSearchController = new AbortController();

    // 记录搜索
    try {
      await $fetch("/api/search/record", {
        method: "POST",
        body: { keyword: keyword },
        signal: currentSearchController.signal,
      });
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("记录搜索失败:", {
          error: error.message || error,
          keyword: keyword,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // 更新搜索状态
    sources.value = [];
    queue.length = 0;
    running = 0;
    window._needProcessQuarkLinks = false;

    // 重置加载进度
    loadingProgress.value = {
      total: sourcesApiEndpoints.length,
      completed: 0,
      isLoading: true,
    };

    // 优先处理 aipan-search
    const aipanEndpoint = sourcesApiEndpoints.find(
      (item) => item.api === "/api/sources/aipan-search"
    );
    const otherEndpoints = sourcesApiEndpoints.filter(
      (item) => item.api !== "/api/sources/aipan-search"
    );

    if (aipanEndpoint) {
      await handleSingleSearch(
        aipanEndpoint,
        keyword,
        sources,
        loadingProgress
      );
    }

    // 处理其他接口
    otherEndpoints.forEach((item) => {
      handleSingleSearch(item, keyword, sources, loadingProgress);
    });
  };

  // 搜索VOD内容
  const searchByVod = async (
    keyword,
    vodData,
    loadingStatus,
    vodConfigSources
  ) => {
    if (!keyword || keyword.trim() === "") {
      vodData.value = [];
      return;
    }

    vodData.value = [];

    // 清理之前的加载状态
    loadingStatus.value.clear();

    // 使用 Promise.allSettled 处理并发请求，避免竞态条件
    const searchPromises = vodConfigSources.value.map((vodApi) => {
      loadingStatus.value.set(vodApi.api, true);
      return handleSingleVodSearch(vodApi, keyword, vodData, loadingStatus);
    });

    await Promise.allSettled(searchPromises);
  };

  // 清理函数
  const cleanup = () => {
    if (currentSearchController) {
      currentSearchController.abort();
      currentSearchController = null;
    }

    currentVodSearches.forEach((controller) => controller.abort());
    currentVodSearches.clear();

    queue.length = 0;
    running = 0;
  };

  return {
    handleSearch,
    searchByVod,
    handleSingleSearch,
    handleSingleVodSearch,
    cleanup,
  };
};
