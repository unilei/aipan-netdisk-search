import type { H3Event } from "h3";
import { createRateLimiter } from "~/server/utils/rateLimit";
import { getSearchModerationFailure } from "~/server/utils/sourceModeration";
import { detectLinkService } from "~/server/utils/aipan";
import type { Link } from "~/server/utils/aipan";

interface SearchBody {
  name: string;
}

interface SohaojuSseItem {
  title?: string;
  url?: string;
  password?: string;
  is_type?: number;
}

interface SaveUrlResponse {
  code?: number;
  message?: string;
  data?: {
    title?: string;
    url?: string;
  };
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

const rateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 20 });

const BASE_URLS = ["https://www.sohaoju.com", "https://www.soquark.com"];
const PUBLIC_SEARCH_TYPES = [0, 2];
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36";
const MAX_ITEMS_PER_TYPE = 8;
const MAX_RESOLVED_LINKS = 18;
const SSE_READ_TIMEOUT_MS = 6500;
const SAVE_URL_TIMEOUT_MS = 9000;

const isAllowedDomain = (host: string, referer: string) =>
  host.endsWith("aipan.me") ||
  referer.includes("aipan.me") ||
  host.includes("localhost");

const createAbortSignal = (timeoutMs: number) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  return {
    signal: controller.signal,
    abort: () => controller.abort(),
    clear: () => clearTimeout(timeout),
  };
};

const normalizeLink = (url: string) =>
  url.replace(/\\\//g, "/").replace(/&amp;/g, "&").trim().replace(/[.,，。；;]+$/, "");

const extractPassword = (url: string, fallback?: string) =>
  url.match(/[?&](?:pwd|password)=([A-Za-z0-9]+)/i)?.[1] ||
  fallback?.match(/^[A-Za-z0-9]+$/)?.[0];

const getSession = async (baseUrl: string, searchTerm: string) => {
  const pageUrl = `${baseUrl}/s/${encodeURIComponent(searchTerm)}.html`;
  const timeout = createAbortSignal(12_000);

  try {
    const response = await fetch(pageUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: timeout.signal,
    });
    const html = await response.text();
    const sessionCookie = (response.headers.get("set-cookie") || "").split(";")[0];

    if (!response.ok || !sessionCookie || !html.includes("web_search")) {
      throw new Error(`Sohaoju session unavailable: ${response.status}`);
    }

    return { pageUrl, sessionCookie };
  } finally {
    timeout.clear();
  }
};

const parseSseLine = (line: string): SohaojuSseItem | null => {
  if (!line.startsWith("data: ")) {
    return null;
  }

  try {
    return JSON.parse(line.slice(6)) as SohaojuSseItem;
  } catch {
    return null;
  }
};

const readSseItems = async (
  baseUrl: string,
  searchTerm: string,
  searchType: number,
  session: { pageUrl: string; sessionCookie: string },
) => {
  const timeout = createAbortSignal(SSE_READ_TIMEOUT_MS);
  const items: SohaojuSseItem[] = [];
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;

  try {
    const response = await fetch(
      `${baseUrl}/api/other/web_search?title=${encodeURIComponent(searchTerm)}&is_type=${searchType}`,
      {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/event-stream",
          Cookie: session.sessionCookie,
          Referer: session.pageUrl,
        },
        signal: timeout.signal,
      },
    );

    if (!response.ok || !response.body) {
      throw new Error(`Sohaoju stream unavailable: ${response.status}`);
    }

    reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (items.length < MAX_ITEMS_PER_TYPE) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || "";

      lines.forEach((line) => {
        const item = parseSseLine(line.trim());
        if (item?.title && item?.url && items.length < MAX_ITEMS_PER_TYPE) {
          items.push(item);
        }
      });
    }

    return items;
  } catch (error: any) {
    if (items.length > 0) {
      return items;
    }
    throw error;
  } finally {
    timeout.abort();
    timeout.clear();
    await reader?.cancel().catch(() => undefined);
  }
};

const resolveShareLink = async (
  baseUrl: string,
  item: SohaojuSseItem,
  session: { pageUrl: string; sessionCookie: string },
) => {
  const title = String(item.title || "").trim();
  const encryptedUrl = String(item.url || "").trim();
  if (!title || !encryptedUrl) {
    return null;
  }

  if (/^https?:\/\//i.test(encryptedUrl)) {
    const link = normalizeLink(encryptedUrl);
    return {
      name: title,
      link: {
        service: detectLinkService(link),
        link,
        pwd: extractPassword(link, item.password),
      },
    };
  }

  const timeout = createAbortSignal(SAVE_URL_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/api/other/save_url`, {
      method: "POST",
      headers: {
        "User-Agent": USER_AGENT,
        "Content-Type": "application/json",
        Accept: "application/json, text/plain, */*",
        Cookie: session.sessionCookie,
        Origin: baseUrl,
        Referer: session.pageUrl,
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify({
        url: encodeURIComponent(encryptedUrl),
        title,
      }),
      signal: timeout.signal,
    });
    const data = (await response.json().catch(() => null)) as SaveUrlResponse | null;
    const resolvedUrl = normalizeLink(data?.data?.url || "");

    if (!response.ok || data?.code !== 200 || !resolvedUrl) {
      return null;
    }

    return {
      name: data.data?.title || title,
      link: {
        service: detectLinkService(resolvedUrl),
        link: resolvedUrl,
        pwd: extractPassword(resolvedUrl, item.password),
      },
    };
  } finally {
    timeout.clear();
  }
};

const resolveInBatches = async (
  items: SohaojuSseItem[],
  baseUrl: string,
  session: { pageUrl: string; sessionCookie: string },
) => {
  const resolved: Array<{ name: string; link: Link }> = [];
  const queue = items.slice(0, MAX_RESOLVED_LINKS);
  const batchSize = 4;

  for (let index = 0; index < queue.length; index += batchSize) {
    const batch = queue.slice(index, index + batchSize);
    const settled = await Promise.allSettled(
      batch.map((item) => resolveShareLink(baseUrl, item, session)),
    );

    settled.forEach((result) => {
      if (result.status === "fulfilled" && result.value) {
        resolved.push(result.value);
      }
    });
  }

  return resolved;
};

const groupResults = (resolved: Array<{ name: string; link: Link }>): TransformedItem[] => {
  const grouped = new Map<string, Link[]>();

  resolved.forEach(({ name, link }) => {
    const links = grouped.get(name) || [];
    const duplicate = links.some(
      (existing) => existing.link === link.link && existing.pwd === link.pwd,
    );

    if (!duplicate) {
      links.push(link);
      grouped.set(name, links);
    }
  });

  return Array.from(grouped.entries())
    .map(([name, links]) => ({ name, links }))
    .filter((item) => item.links.length > 0);
};

const fetchSohaojuSource = async (searchTerm: string): Promise<TransformedResult> => {
  const errors: string[] = [];

  for (const baseUrl of BASE_URLS) {
    try {
      const session = await getSession(baseUrl, searchTerm);
      const itemGroups = await Promise.allSettled(
        PUBLIC_SEARCH_TYPES.map((searchType) =>
          readSseItems(baseUrl, searchTerm, searchType, session),
        ),
      );
      const items = itemGroups
        .filter((result): result is PromiseFulfilledResult<SohaojuSseItem[]> =>
          result.status === "fulfilled",
        )
        .flatMap((result) => result.value);

      if (items.length === 0) {
        errors.push(`${baseUrl}: no stream results`);
        continue;
      }

      const resolved = await resolveInBatches(items, baseUrl, session);
      const list = groupResults(resolved);

      if (list.length > 0) {
        return {
          list,
          code: 200,
          msg: "success",
        };
      }

      errors.push(`${baseUrl}: no resolvable links`);
    } catch (error: any) {
      errors.push(`${baseUrl}: ${error?.message || "unknown error"}`);
    }
  }

  return {
    list: [],
    code: errors.length > 0 ? 502 : 206,
    msg: errors[0] || "未找到相关资源",
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

      return await fetchSohaojuSource(searchTerm);
    } catch (error: any) {
      console.error("[Sohaoju] 搜索失败:", error);
      return {
        list: [],
        code: 500,
        msg: error?.message || "Internal server error",
      };
    }
  },
);
