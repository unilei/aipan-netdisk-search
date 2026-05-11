export const MODERATION_CONTEXTS = {
  netdiskSearch: "netdisk_search",
  aiSearch: "ai_search",
};

export const useModerationCheck = () => {
  const checkModeration = async (text, context = MODERATION_CONTEXTS.netdiskSearch) => {
    const value = String(text || "").trim();

    if (!value) {
      return {
        action: "allow",
        allowed: true,
        needsReview: false,
        shouldRecord: false,
        risk: "none",
        categories: [],
        message: "",
      };
    }

    try {
      const response = await $fetch("/api/moderation/check", {
        method: "POST",
        body: {
          text: value,
          context,
        },
      });

      return response?.data || {
        action: "allow",
        allowed: true,
        needsReview: false,
        shouldRecord: true,
        risk: "none",
        categories: [],
        message: "",
      };
    } catch (error) {
      console.error("内容审核检查失败:", error);
      return {
        action: "allow",
        allowed: true,
        needsReview: false,
        shouldRecord: true,
        risk: "none",
        categories: [],
        message: "",
      };
    }
  };

  return {
    checkModeration,
  };
};
