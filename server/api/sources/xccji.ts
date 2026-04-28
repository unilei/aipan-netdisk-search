import type { H3Event } from "h3";
import { executeApiRequests } from "~/server/utils/aipan";
import type {
  SearchBody,
  TransformedResult,
  ApiEndpoint,
  Token,
} from "~/server/utils/aipan";
import { createRateLimiter } from "~/server/utils/rateLimit";

const rateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 20 });

const getApiEndpoints = (baseUrl: string, searchTerm: string): ApiEndpoint[] => [
  {
    url: `${baseUrl}/api/getJuzi`,
    priority: 1,
  },
  {
    url: `${baseUrl}/api/sortWeb`,
    append: {
      tabN: "movie_200317xlb",
      topNo: 10,
      whr: `question like "%${searchTerm}%"`,
      orderBy: "isTop DESC, date_time",
      orderType: "DESC",
      keys: "question,answer,isTop,id",
      searchKey: searchTerm,
    },
    priority: 1,
  },
  {
    url: `${baseUrl}/api/getTop`,
    priority: 2,
  },
  {
    url: `${baseUrl}/api/getDyfx`,
    priority: 3,
  },
  {
    url: `${baseUrl}/api/getTTZJB`,
    priority: 3,
  },
  {
    url: `${baseUrl}/api/getGirls`,
    priority: 3,
  },
  {
    url: `${baseUrl}/api/getXiaoy`,
    priority: 3,
  },
  {
    url: `${baseUrl}/api/getGGang`,
    priority: 3,
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

      const rawUrl = "http://xccji.top";
      const baseUrl = rawUrl.endsWith("/v") ? rawUrl : `${rawUrl}/v`;
      const tokenUrl = `${baseUrl}/api/gettoken`;

      const tokenResponse = await $fetch<Token>(tokenUrl, {
        method: "GET",
        timeout: 12000,
      });

      if (!tokenResponse?.token) {
        return {
          list: [],
          code: 502,
          msg: "Source token unavailable",
        };
      }

      return await executeApiRequests(
        getApiEndpoints(baseUrl, body.name.trim()),
        body,
        tokenResponse.token
      );
    } catch (error: any) {
      console.error("[Source 4] 搜索失败:", error);
      return {
        list: [],
        code: 500,
        msg: error?.message || "Internal server error",
      };
    }
  }
);
