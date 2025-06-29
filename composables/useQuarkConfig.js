// 夸克网盘配置管理 composable
export const useQuarkConfig = () => {
  const { smartCache } = useSmartCache();

  // 夸克配置
  const quarkConfig = ref({
    apiUrl: "",
    quarkCookie: "",
    typeId: "",
    userId: "",
    enabled: false,
  });

  // 获取夸克配置
  const getQuarkConfig = async () => {
    try {
      const configCacheKey = "quark-config";
      const cachedConfig = await smartCache.getWithStrategy(configCacheKey);

      if (cachedConfig) {
        quarkConfig.value = cachedConfig;
        return;
      }

      const res = await $fetch("/api/quark/setting", {
        method: "GET",
        timeout: 10000,
        retry: 2,
        retryDelay: 1000
      });

      if (res.success && res.data) {
        const config = {
          apiUrl: res.data.apiUrl || quarkConfig.value.apiUrl,
          quarkCookie: res.data.quarkCookie,
          typeId: res.data.typeId,
          userId: res.data.userId,
          enabled: res.data.enabled,
        };
        quarkConfig.value = config;
        await smartCache.setWithStrategy(configCacheKey, config, "config");
      }
    } catch (error) {
      console.error("Failed to get quark config:", error);
    }
  };

  // 清除配置缓存
  const clearConfigCache = () => {
    if (process.client) {
      const configCacheKey = "quark-config";
      smartCache.cache.delete(configCacheKey);
    }
  };

  // 保存到夸克网盘
  const saveToQuarkAsync = async (link, name) => {
    if (!quarkConfig.value.enabled ||
      !quarkConfig.value.quarkCookie ||
      !quarkConfig.value.typeId ||
      !quarkConfig.value.userId) {
      return false;
    }

    try {
      const saveRes = await $fetch(quarkConfig.value.apiUrl, {
        method: "POST",
        body: {
          shareurl: link,
          savepath: `/yingshifenxiang/${name}`,
        },
        headers: {
          Cookiequark: quarkConfig.value.quarkCookie,
          "Content-Type": "application/json",
        },
        timeout: 30000, // 30秒超时
        retry: 2,
        retryDelay: 1000
      });

      if (saveRes.code === 401 || saveRes.code === 403) {
        clearConfigCache();
        await getQuarkConfig();
        ElMessage.error("认证失败，请重新配置夸克网盘");
        return false;
      }

      const shareInfo = saveRes.data.share_info;
      if (shareInfo) {
        await $fetch("/api/quark/post", {
          method: "POST",
          body: {
            name,
            links: JSON.stringify([{ key: Date.now(), value: shareInfo.share_url }]),
            typeId: quarkConfig.value.typeId,
            userId: quarkConfig.value.userId,
          },
          timeout: 30000, // 30秒超时
          retry: 2,
          retryDelay: 1000
        });
        ElMessage.success(`${name} 转存成功`);
        return true;
      }

      ElMessage.error(`${name} 转存失败`);
      return false;
    } catch (err) {
      console.error("保存夸克文件失败:", {
        error: err.message || err,
        status: err.status || 'unknown',
        name,
        link,
        timestamp: new Date().toISOString()
      });

      if (err.status === 401 || err.status === 403) {
        clearConfigCache();
        ElMessage.error("认证失败，请重新配置夸克网盘");
      } else {
        ElMessage.error(`${name} 转存失败: ${err.message || '网络错误'}`);
      }
      return false;
    }
  };

  return {
    quarkConfig,
    getQuarkConfig,
    clearConfigCache,
    saveToQuarkAsync
  };
};
