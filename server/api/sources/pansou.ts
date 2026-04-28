import type { H3Event } from "h3";
import { $fetch } from "ofetch";
import { createRateLimiter } from "~/server/utils/rateLimit";

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

interface PansouItem {
  url: string;
  password: string;
  note: string;
  datetime: string;
}

interface PansouApiResponse {
  code: number;
  message: string;
  data?: {
    total?: number;
    merged_by_type?: Record<string, PansouItem[] | undefined>;
  };
}

const rateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 20 });

const DEFAULT_INSTANCE_URLS = [
  "https://so.252035.xyz/api/search",
  "https://pansou.aipan.me/api/search",
  "https://pansou.app/api/search",
];

const SERVICE_MAPPING: Record<string, Link["service"]> = {
  baidu: "BAIDU",
  xunlei: "XUNLEI",
  quark: "QUARK",
  uc: "UC",
  tianyi: "TIANYI",
  mobile: "MOBILE",
  "115": "115",
  pikpak: "PIKPAK",
  "123": "123",
  aliyun: "ALIYUN",
  magnet: "MAGNET",
  ed2k: "ED2K",
  others: "OTHER",
};

const isAllowedDomain = (host: string, referer: string) =>
  host.endsWith("aipan.me") ||
  referer.includes("aipan.me") ||
  host.includes("localhost");

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();

const normalizeTitle = (note: string, searchTerm: string) => {
  const headline = note.split(/(?:描述|链接)[:：]/)[0] || note;
  const firstLine = headline.split(/\n/)[0] || headline;
  const cleanedTitle = firstLine
    .replace(/^名称[:：]\s*/i, "")
    .replace(
      /^【|】$|🗄｜🔥|✅|🀄|🔴|🟢|💖|❤️|💚|💛|🍄|🔶|◀|▉|▶|━|─|＞|｜|📽️|🎞️|🏠|%%|⚡|🌟|⭐|🎬|🎥|🎯|🎪|🎭|🎨|🎤|🎵|🎶/g,
      ""
    );

  return normalizeWhitespace(cleanedTitle || searchTerm);
};

const normalizeLink = (url: string) =>
  url.replace(/&amp;/g, "&").trim().replace(/[.,，。；;]+$/, "");

const getInstanceUrls = (event: H3Event) => {
  const config = useRuntimeConfig(event);
  const configuredUrls = String(config.pansouApiUrls || "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);

  return Array.from(new Set([...configuredUrls, ...DEFAULT_INSTANCE_URLS]));
};

const fetchInstance = async (
  apiUrl: string,
  searchTerm: string
): Promise<PansouApiResponse> => {
  const params = new URLSearchParams({
    kw: searchTerm,
    refresh: "false",
    res: "merge",
    src: "all",
  });

  return await $fetch<PansouApiResponse>(`${apiUrl}?${params.toString()}`, {
    method: "GET",
    timeout: 15000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
      Accept: "application/json",
    },
  });
};

const transformResponses = (
  responses: PansouApiResponse[],
  searchTerm: string
): TransformedResult => {
  const grouped = new Map<string, TransformedItem>();
  const globalLinkIndex = new Map<string, string>();
  const searchTermLower = searchTerm.toLowerCase();

  responses.forEach((response) => {
    Object.entries(response.data?.merged_by_type || {}).forEach(([type, items]) => {
      if (!items?.length) {
        return;
      }

      const service = SERVICE_MAPPING[type] || "OTHER";

      items.forEach((item) => {
        const title = normalizeTitle(item.note || "", searchTerm);
        const rawText = `${title} ${item.note || ""}`.toLowerCase();
        if (!title || !rawText.includes(searchTermLower)) {
          return;
        }

        const link = normalizeLink(item.url || "");
        if (!link) {
          return;
        }

        const pwd = item.password || undefined;
        const linkKey = `${service}|${link}|${pwd || ""}`;
        const groupKey = globalLinkIndex.get(linkKey) || title;

        if (!grouped.has(groupKey)) {
          grouped.set(groupKey, {
            name: groupKey,
            links: [],
          });
        }

        const current = grouped.get(groupKey)!;
        const duplicate = current.links.some(
          (existing) =>
            existing.service === service &&
            existing.link === link &&
            existing.pwd === pwd
        );

        if (!duplicate) {
          current.links.push({
            service,
            link,
            pwd,
          });
          globalLinkIndex.set(linkKey, groupKey);
        }
      });
    });
  });

  const list = Array.from(grouped.values())
    .filter((item) => item.links.length > 0)
    .sort((a, b) => {
      const byLinkCount = b.links.length - a.links.length;
      if (byLinkCount !== 0) {
        return byLinkCount;
      }

      return a.name.length - b.name.length;
    })
    .slice(0, 120);

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

      const instanceUrls = getInstanceUrls(event);
      const settled = await Promise.allSettled(
        instanceUrls.map((apiUrl) => fetchInstance(apiUrl, searchTerm))
      );

      const successes = settled
        .filter(
          (result): result is PromiseFulfilledResult<PansouApiResponse> =>
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

      const mergedResult = transformResponses(successes, searchTerm);
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
