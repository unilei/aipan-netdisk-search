// 搜索逻辑管理 composable
export const useSearchLogic = () => {
  const { smartCache } = useSmartCache();
  const { quarkConfig } = useQuarkConfig();
  const { queueState, processQueue } = useSearchQueue();

  // 请求去重管理
  let currentSearchController = null;
  let activeSearchId = 0;

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
  const isAbortError = (error) => {
    return error?.name === "AbortError" || error?.cause?.name === "AbortError";
  };

  const fetchWithRetry = async (url, options = {}, maxRetries = 3) => {
    let lastError;

    // 获取用户token
    const token = useCookie('token').value;

    for (let i = 0; i < maxRetries; i++) {
      try {
        if (options.signal?.aborted) {
          throw new DOMException("The operation was aborted.", "AbortError");
        }

        const headers = { ...options.headers };
        // 如果有token，添加到请求头
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await $fetch(url, {
          ...options,
          headers,
          timeout: 15000,
        });
        return response;
      } catch (error) {
        lastError = error;
        if (isAbortError(error) || options.signal?.aborted) {
          throw error;
        }
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
    loadingProgress,
    searchContext = {}
  ) => {
    const encodedKeyword = encodeURIComponent(keyword.trim());
    const cacheKey = `${item.api}-${encodedKeyword}`;
    const effectiveSearchId = searchContext.searchId ?? activeSearchId;
    const isCurrentSearch = () => {
      return (
        activeSearchId === effectiveSearchId &&
        !searchContext.signal?.aborted
      );
    };

    const task = async () => {
      try {
        if (!isCurrentSearch()) {
          return;
        }

        // 尝试从缓存获取
        const cachedData = await smartCache.getWithStrategy(cacheKey);

        if (cachedData) {
          if (!isCurrentSearch()) {
            return;
          }

          if (item.api === "/api/sources/local") {
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
          signal: searchContext.signal,
        });

        if (res.list && Array.isArray(res.list)) {
          if (!isCurrentSearch()) {
            return;
          }

          // 设置缓存
          await smartCache.setWithStrategy(cacheKey, res.list, "search");

          if (item.api === "/api/sources/local") {
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
        if (isAbortError(err) || searchContext.signal?.aborted) {
          return;
        }

        console.error(`搜索失败 ${item.api}:`, {
          error: err.message || err,
          api: item.api,
          keyword: keyword,
          timestamp: new Date().toISOString(),
        });
      } finally {
        if (isCurrentSearch()) {
          loadingProgress.value.completed++;
          if (loadingProgress.value.completed >= loadingProgress.value.total) {
            loadingProgress.value.isLoading = false;
            delete window._needProcessQuarkLinks;
          }
        }
      }
    };

    queue.push(task);
    runQueue();
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
    const searchId = ++activeSearchId;
    const searchContext = {
      searchId,
      signal: currentSearchController.signal,
    };

    // 记录搜索
    try {
      await $fetch("/api/search/record", {
        method: "POST",
        body: { keyword: keyword },
        signal: searchContext.signal,
      });
    } catch (error) {
      if (!isAbortError(error)) {
        console.error("记录搜索失败:", {
          error: error.message || error,
          keyword: keyword,
          timestamp: new Date().toISOString(),
        });
      }
    }

    if (searchContext.signal.aborted || activeSearchId !== searchId) {
      return;
    }

    // 更新搜索状态
    sources.value = [];
    queue.length = 0;
    window._needProcessQuarkLinks = false;

    // 确保加载状态已设置（如果外部没有设置的话）
    if (!loadingProgress.value.isLoading) {
      loadingProgress.value = {
        total: sourcesApiEndpoints.length,
        completed: 0,
        isLoading: true,
      };
    }

    // 优先处理 1
    const aipanEndpoint = sourcesApiEndpoints.find(
      (item) => item.api === "/api/sources/local"
    );
    const otherEndpoints = sourcesApiEndpoints.filter(
      (item) => item.api !== "/api/sources/local"
    );

    if (aipanEndpoint) {
      await handleSingleSearch(
        aipanEndpoint,
        keyword,
        sources,
        loadingProgress,
        searchContext
      );
    }

    // 处理其他接口
    otherEndpoints.forEach((item) => {
      handleSingleSearch(item, keyword, sources, loadingProgress, searchContext);
    });
  };

  // 清理函数
  const cleanup = () => {
    if (currentSearchController) {
      currentSearchController.abort();
      currentSearchController = null;
    }

    queue.length = 0;
  };

  return {
    handleSearch,
    handleSingleSearch,
    cleanup,
  };
};
