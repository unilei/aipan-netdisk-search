import type { H3Event } from "h3";
import { executeApiRequests } from "~/server/utils/aipan";
import type {
  SearchBody,
  TransformedResult,
  ApiEndpoint,
  Token,
} from "~/server/utils/aipan";

const RATE_LIMIT = {
  windowMs: 60 * 1000,
  maxRequests: 20,
  requests: new Map<string, { count: number; resetTime: number }>(),
};

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

const isRateLimited = (clientIp: string) => {
  const now = Date.now();
  const current = RATE_LIMIT.requests.get(clientIp);

  if (!current || now > current.resetTime) {
    RATE_LIMIT.requests.set(clientIp, {
      count: 1,
      resetTime: now + RATE_LIMIT.windowMs,
    });
    return false;
  }

  if (current.count >= RATE_LIMIT.maxRequests) {
    return true;
  }

  current.count += 1;
  return false;
};

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

      if (isRateLimited(clientIp)) {
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
