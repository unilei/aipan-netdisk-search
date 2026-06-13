import {
  evaluateModerationWithConfig,
  MODERATION_CONTEXTS,
  summarizeModerationDecision,
} from "~/server/utils/moderation";

const PUBLIC_CONTEXTS = new Set([
  MODERATION_CONTEXTS.netdiskSearch,
  MODERATION_CONTEXTS.aiSearch,
]);
type PublicModerationContext = typeof MODERATION_CONTEXTS.netdiskSearch | typeof MODERATION_CONTEXTS.aiSearch;

const toPublicDecision = (decision: ReturnType<typeof summarizeModerationDecision>) => ({
  action: decision.action,
  allowed: decision.allowed,
  needsReview: decision.needsReview,
  shouldRecord: decision.shouldRecord,
  risk: decision.risk,
  categories: decision.categories,
  message: decision.message,
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const text = String(body?.text || "");
  const requestedContext = String(body?.context || MODERATION_CONTEXTS.netdiskSearch);
  const context = PUBLIC_CONTEXTS.has(requestedContext as PublicModerationContext)
    ? requestedContext
    : MODERATION_CONTEXTS.netdiskSearch;

  const decision = await evaluateModerationWithConfig(text, { context: context as PublicModerationContext });

  return {
    code: 200,
    data: toPublicDecision(summarizeModerationDecision(decision)),
  };
});
