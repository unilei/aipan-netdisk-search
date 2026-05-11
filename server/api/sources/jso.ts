import type { H3Event } from "h3";
import { $fetch } from "ofetch";
import { createRateLimiter } from "~/server/utils/rateLimit";
import { getSearchModerationFailure } from "~/server/utils/sourceModeration";

interface SearchBody {
  name: string;
}

interface Link {
  service:
    | "BAIDU"
    | "XUNLEI"
    | "QUARK"
    | "ALIYUN"
    | "UC"
    | "TIANYI"
    | "MOBILE"
    | "115"
    | "PIKPAK"
    | "123"
    | "MAGNET"
    | "ED2K"
    | "OTHER";
  link: string;
  pwd?: string;
}

interface TransformedItem {
  name: string;
  links: Link[];
}

interface TransformedResult {
  list: TransformedItem[];
  code?: number;
  msg?: string;
}

interface JsoItem {
  name: string;
  link: string;
  time?: string;
  source?: string;
}

interface JsoResponse {
  code: number;
  msg?: string;
  data?: JsoItem[];
}

const rateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 20 });

const API_ENDPOINTS = [
  "https://j-so.com/api/search111.php",
  "https://j-so.com/api/heapi111.php",
];

const REQUEST_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
  "Content-Type": "application/json",
  Accept: "application/json,text/plain,*/*",
  Origin: "https://j-so.com",
  Referer: "https://j-so.com/",
  "X-Requested-With": "XMLHttpRequest",
};

const isAllowedDomain = (host: string, referer: string) =>
  host.endsWith("aipan.me") ||
  referer.includes("aipan.me") ||
  host.includes("localhost");

const normalizeLink = (url: string) =>
  url.replace(/&amp;/g, "&").trim().replace(/[.,，。；;#]+$/, "");

const detectService = (url: string): Link["service"] => {
  if (url.includes("pan.baidu.com")) {
    return "BAIDU";
  }
  if (url.includes("pan.xunlei.com")) {
    return "XUNLEI";
  }
  if (url.includes("pan.quark.cn")) {
    return "QUARK";
  }
  if (url.includes("aliyundrive.com") || url.includes("alipan.com")) {
    return "ALIYUN";
  }
  if (url.includes("drive.uc.cn")) {
    return "UC";
  }
  if (url.includes("cloud.189.cn")) {
    return "TIANYI";
  }
  if (url.includes("yun.139.com") || url.includes("caiyun.139.com")) {
    return "MOBILE";
  }
  if (url.includes("115cdn.com")) {
    return "115";
  }
  if (url.includes("mypikpak.com")) {
    return "PIKPAK";
  }
  if (/(?:123684|123865|123912|123pan)\.(?:com|cn)/i.test(url)) {
    return "123";
  }
  if (url.startsWith("magnet:?")) {
    return "MAGNET";
  }
  if (url.startsWith("ed2k://")) {
    return "ED2K";
  }

  return "OTHER";
};

const extractPassword = (url: string) =>
  url.match(/[?&](?:pwd|password)=([A-Za-z0-9]+)/i)?.[1];

const fetchEndpoint = async (
  url: string,
  searchTerm: string
): Promise<JsoResponse> => {
  return await $fetch<JsoResponse>(url, {
    method: "POST",
    headers: REQUEST_HEADERS,
    body: {
      query: searchTerm,
    },
    timeout: 20000,
  });
};

const transformResponses = (responses: JsoResponse[]): TransformedResult => {
  const grouped = new Map<string, Link[]>();

  responses.forEach((response) => {
    (response.data || []).forEach((item) => {
      const name = item.name?.replace(/\s+/g, " ").trim();
      const rawLink = item.link?.trim();
      if (!name || !rawLink) {
        return;
      }

      const link = normalizeLink(rawLink);
      const links = grouped.get(name) || [];
      const entry: Link = {
        service: detectService(link),
        link,
        pwd: extractPassword(link),
      };

      const duplicate = links.some(
        (existing) =>
          existing.service === entry.service &&
          existing.link === entry.link &&
          existing.pwd === entry.pwd
      );

      if (!duplicate) {
        links.push(entry);
        grouped.set(name, links);
      }
    });
  });

  const list = Array.from(grouped.entries())
    .map(([name, links]) => ({ name, links }))
    .filter((item) => item.links.length > 0)
    .sort((a, b) => {
      const byLinkCount = b.links.length - a.links.length;
      if (byLinkCount !== 0) {
        return byLinkCount;
      }

      return a.name.length - b.name.length;
    });

  return {
    list,
    code: list.length > 0 ? 200 : 206,
    msg: list.length > 0 ? "success" : "未找到相关资源",
  };
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

      const settled = await Promise.allSettled(
        API_ENDPOINTS.map((url) => fetchEndpoint(url, searchTerm))
      );

      const responses = settled
        .filter(
          (result): result is PromiseFulfilledResult<JsoResponse> =>
            result.status === "fulfilled" &&
            result.value.code === 200 &&
            Array.isArray(result.value.data)
        )
        .map((result) => result.value);

      if (responses.length === 0) {
        const firstError = settled.find(
          (result): result is PromiseRejectedResult => result.status === "rejected"
        );

        return {
          list: [],
          code: 502,
          msg:
            firstError?.reason?.message || "All J-So upstreams failed to respond",
        };
      }

      const merged = transformResponses(responses);
      const failedCount = settled.filter(
        (result) => result.status === "rejected"
      ).length;

      if (failedCount > 0 && merged.list.length > 0) {
        merged.msg = `success (${failedCount}/${API_ENDPOINTS.length} upstreams failed)`;
      }

      return merged;
    } catch (error: any) {
      console.error("[Source 13] 搜索失败:", error);
      return {
        list: [],
        code: 500,
        msg: error?.message || "Internal server error",
      };
    }
  }
);
