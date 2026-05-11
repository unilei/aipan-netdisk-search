import {
  evaluateModerationWithConfig,
  MODERATION_CONTEXTS,
  summarizeModerationDecision,
} from "~/server/utils/moderation";

export const getSearchModerationFailure = async (searchTerm: string) => {
  const decision = await evaluateModerationWithConfig(searchTerm, {
    context: MODERATION_CONTEXTS.netdiskSearch,
  });

  if (decision.allowed) {
    return null;
  }

  return {
    list: [],
    code: 400,
    msg: decision.message || "搜索内容包含敏感信息，请修改后重试",
    moderation: summarizeModerationDecision(decision),
  };
};
