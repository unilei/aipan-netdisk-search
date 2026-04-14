import type { H3Event } from "h3";
import { executeApiRequests } from "~/server/utils/aipan";
import type {
  SearchBody,
  TransformedResult,
  ApiEndpoint,
} from "~/server/utils/aipan";

const RATE_LIMIT = {
  windowMs: 60 * 1000,
  maxRequests: 20,
  requests: new Map<string, { count: number; resetTime: number }>(),
};

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

      return await executeApiRequests(
        getApiEndpoints(),
        {
          name: body.name.trim(),
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
