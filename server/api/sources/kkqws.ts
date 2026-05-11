import type { H3Event } from "h3";
import { executeApiRequests } from "~/server/utils/aipan";
import type {
  SearchBody,
  TransformedResult,
  ApiEndpoint,
} from "~/server/utils/aipan";
import { createRateLimiter } from "~/server/utils/rateLimit";
import { getSearchModerationFailure } from "~/server/utils/sourceModeration";

const rateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 20 });

const WORKING_TOKEN = "i69";
const BASE_URL = "http://m.kkqws.com";

const getApiEndpoints = (): ApiEndpoint[] => [
  {
    url: `${BASE_URL}/v/api/getJuzi`,
    append: {},
    priority: 2,
  },
  {
    url: `${BASE_URL}/v/api/getXiaoyu`,
    append: {},
    priority: 2,
  },
  {
    url: `${BASE_URL}/v/api/search`,
    append: {},
    priority: 1,
  },
];

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
      if (!body?.name?.trim()) {
        return {
          list: [],
          code: 400,
          msg: "Search term is required",
        };
      }
      const searchTerm = body.name.trim();
      const moderationFailure = await getSearchModerationFailure(searchTerm);
      if (moderationFailure) {
        return moderationFailure;
      }

      return await executeApiRequests(
        getApiEndpoints(),
        {
          name: searchTerm,
        },
        WORKING_TOKEN
      );
    } catch (error: any) {
      console.error("[Source 2] 搜索失败:", error);
      return {
        list: [],
        code: 500,
        msg: error?.message || "Internal server error",
      };
    }
  }
);
