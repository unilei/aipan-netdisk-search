import {
  evaluateModerationWithConfig,
  MODERATION_CONTEXTS,
  summarizeModerationDecision,
} from "~/server/utils/moderation";

const ADMIN_CONTEXTS = new Set(Object.values(MODERATION_CONTEXTS));

export default defineEventHandler(async (event) => {
  const user = event.context.user;

  if (!user || user.role !== "admin") {
    return {
      code: 403,
      msg: "无权限访问",
    };
  }

  const body = await readBody(event);
  const text = String(body?.text || "");
  const requestedContext = String(body?.context || MODERATION_CONTEXTS.netdiskSearch);
  const context = ADMIN_CONTEXTS.has(requestedContext)
    ? requestedContext
    : MODERATION_CONTEXTS.netdiskSearch;
  const decision = await evaluateModerationWithConfig(text, { context });

  return {
    code: 200,
    data: summarizeModerationDecision(decision),
  };
});
