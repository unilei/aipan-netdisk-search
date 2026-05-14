import type { H3Event } from "h3";
import { buildExternalPanSearchResult } from "~/server/services/search/externalPanSources.mjs";
import { createRateLimiter } from "~/server/utils/rateLimit";
import { getSearchModerationFailure } from "~/server/utils/sourceModeration";
import type { SearchBody, TransformedResult } from "~/server/utils/aipan";

const rateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 20 });

const isAllowedDomain = (host: string, referer: string) =>
  host.endsWith("aipan.me") ||
  referer.includes("aipan.me") ||
  host.includes("localhost");

export default defineEventHandler(
  async (event: H3Event): Promise<TransformedResult> => {
    try {
      const host = getRequestHeader(event, "host") || "";
      const referer = getRequestHeader(event, "referer") || "";
      const clientIp = getRequestIP(event) || "unknown";

      if (!isAllowedDomain(host, referer)) {
        return {
          list: [],
          code: 403,
          msg: "Access denied - domain restriction",
        };
      }

      if (rateLimiter.isLimited(clientIp)) {
        return {
          list: [],
          code: 429,
          msg: "Too many requests - please try again later",
        };
      }

      const body = await readBody<SearchBody>(event);
      const searchTerm = body?.name?.trim();

      if (!searchTerm) {
        return {
          list: [],
          code: 400,
          msg: "Search term is required",
        };
      }

      const moderationFailure = await getSearchModerationFailure(searchTerm);
      if (moderationFailure) {
        return moderationFailure;
      }

      return await buildExternalPanSearchResult(searchTerm);
    } catch (error: any) {
      console.error("[ExternalPan] 搜索失败:", error);
      return {
        list: [],
        code: 500,
        msg: error?.message || "Internal server error",
      };
    }
  },
);
