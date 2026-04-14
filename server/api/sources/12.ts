import type { H3Event } from "h3";
import { $fetch } from "ofetch";
import * as cheerio from "cheerio";

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

const RATE_LIMIT = {
  windowMs: 60 * 1000,
  maxRequests: 20,
  requests: new Map<string, { count: number; resetTime: number }>(),
};

const SEARCH_URL = "https://so.slowread.net/search";

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

const normalizeLink = (url: string) =>
  url.replace(/&amp;/g, "&").trim().replace(/[.,，。；;]+$/, "");

const detectService = (url: string, providerHint: string): Link["service"] => {
  const hint = providerHint.toLowerCase();

  if (url.includes("pan.baidu.com") || hint.includes("baidu")) {
    return "BAIDU";
  }
  if (url.includes("pan.xunlei.com") || hint.includes("xunlei")) {
    return "XUNLEI";
  }
  if (url.includes("pan.quark.cn") || hint.includes("quark")) {
    return "QUARK";
  }
  if (
    url.includes("aliyundrive.com") ||
    url.includes("alipan.com") ||
    hint.includes("ali")
  ) {
    return "ALIYUN";
  }
  if (url.includes("drive.uc.cn") || hint.includes("uc")) {
    return "UC";
  }
  if (url.includes("cloud.189.cn") || hint.includes("tianyi")) {
    return "TIANYI";
  }
  if (url.includes("yun.139.com") || url.includes("caiyun.139.com")) {
    return "MOBILE";
  }
  if (url.includes("115cdn.com") || hint.includes("115")) {
    return "115";
  }
  if (url.includes("mypikpak.com") || hint.includes("pikpak")) {
    return "PIKPAK";
  }
  if (/(?:123684|123865|123912|123pan)\.(?:com|cn)/i.test(url) || hint.includes("123")) {
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

const fetchSlowreadSource = async (searchTerm: string): Promise<TransformedResult> => {
  const html = await $fetch(SEARCH_URL, {
    method: "POST",
    body: new URLSearchParams({
      query: searchTerm,
      pan_type: "",
    }).toString(),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
      Referer: "https://so.slowread.net/",
    },
    parseResponse: (text) => text,
    timeout: 15000,
  });

  const $ = cheerio.load(html);
  const grouped = new Map<string, Link[]>();

  $(".result-card").each((_, element) => {
    const card = $(element);
    const anchor = card.find("a.result-link").first();
    const title = anchor.find("h3").text().replace(/\s+/g, " ").trim();
    const href = normalizeLink(anchor.attr("href") || "");
    const providerHint = card.find("img.result-icon").attr("alt") || "";

    if (!title || !href) {
      return;
    }

    const links = grouped.get(title) || [];
    const link: Link = {
      service: detectService(href, providerHint),
      link: href,
      pwd: extractPassword(href),
    };

    const duplicate = links.some(
      (existing) =>
        existing.service === link.service &&
        existing.link === link.link &&
        existing.pwd === link.pwd
    );

    if (!duplicate) {
      links.push(link);
      grouped.set(title, links);
    }
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

      if (isRateLimited(clientIp)) {
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

      return await fetchSlowreadSource(searchTerm);
    } catch (error: any) {
      console.error("[Source 12] 搜索失败:", error);
      return {
        list: [],
        code: 500,
        msg: error?.message || "Internal server error",
      };
    }
  }
);
