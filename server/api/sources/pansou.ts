import type { H3Event } from "h3";
import { $fetch } from "ofetch";
import {
  fetchPansouInstance,
  getPansouMaxResults,
  resolvePansouInstanceUrls,
  transformPansouResponses,
} from "~/server/services/search/pansouSource.mjs";
import { createRateLimiter } from "~/server/utils/rateLimit";
import { getSearchModerationFailure } from "~/server/utils/sourceModeration";

interface SearchBody {
  name: string;
}

interface TransformedResult {
  list: Array<{
    name: string;
    links: Array<{
      service: string;
      link: string;
      pwd?: string;
    }>;
  }>;
  code?: number;
  msg?: string;
}

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

      const config = useRuntimeConfig(event);
      const instanceUrls = resolvePansouInstanceUrls(config);
      const settled = await Promise.allSettled(
        instanceUrls.map((apiUrl) =>
          fetchPansouInstance($fetch, apiUrl, searchTerm, config)
        )
      );

      const successes = settled
        .filter(
          (result): result is PromiseFulfilledResult<any> =>
            result.status === "fulfilled" &&
            result.value.code === 0 &&
            !!result.value.data?.merged_by_type
        )
        .map((result) => result.value);

      if (successes.length === 0) {
        const firstError = settled.find(
          (result): result is PromiseRejectedResult => result.status === "rejected"
        );

        return {
          list: [],
          code: 502,
          msg:
            firstError?.reason?.message ||
            "All PanSou instances failed to respond",
        };
      }

      const mergedResult = transformPansouResponses(successes, searchTerm, {
        maxResults: getPansouMaxResults(config),
      });
      const failedCount = settled.filter(
        (result) => result.status === "rejected"
      ).length;

      if (failedCount > 0 && mergedResult.list.length > 0) {
        mergedResult.msg = `success (${failedCount}/${instanceUrls.length} upstreams failed)`;
      }

      return mergedResult;
    } catch (error: any) {
      console.error("[Source 10] 搜索失败:", error);
      return {
        list: [],
        code: 500,
        msg: error?.message || "Internal server error",
      };
    }
  }
);
