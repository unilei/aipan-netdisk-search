import {
  evaluateModerationWithConfig,
  MODERATION_CONTEXTS,
  summarizeModerationDecision,
} from "~/server/utils/moderation";

const PUBLIC_CONTEXTS = new Set([
  MODERATION_CONTEXTS.netdiskSearch,
  MODERATION_CONTEXTS.aiSearch,
]);

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
  const context = PUBLIC_CONTEXTS.has(requestedContext)
    ? requestedContext
    : MODERATION_CONTEXTS.netdiskSearch;

  const decision = await evaluateModerationWithConfig(text, { context });

  return {
    code: 200,
    data: toPublicDecision(summarizeModerationDecision(decision)),
  };
});
