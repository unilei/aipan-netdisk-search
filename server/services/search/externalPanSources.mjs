import * as cheerio from "cheerio";

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36";

const DEFAULT_TIMEOUT_MS = 9000;
const DEFAULT_LIMIT = 80;
const PANCLUB_DETAIL_LIMIT = 6;

const CLOUD_LINK_REGEX =
  /https?:\/\/(?:pan\.baidu\.com|pan\.quark\.cn|(?:www\.)?(?:aliyundrive|alipan)\.com|pan\.xunlei\.com|cloud\.189\.cn|drive\.uc\.cn|(?:yun|caiyun)\.139\.com|115cdn\.com|mypikpak\.com|toapp\.mypikpak\.com|(?:www\.)?(?:123684|123865|123912|123pan)\.(?:com|cn))\/[^\s<>"']+|magnet:\?[^\s<>"']+|ed2k:\/\/[^\s<>"']+/gi;

const SERVICE_PATTERNS = [
  ["BAIDU", /pan\.baidu\.com/i],
  ["XUNLEI", /pan\.xunlei\.com/i],
  ["QUARK", /pan\.quark\.cn/i],
  ["ALIYUN", /(?:aliyundrive|alipan)\.com/i],
  ["UC", /drive\.uc\.cn/i],
  ["TIANYI", /cloud\.189\.cn/i],
  ["MOBILE", /(?:yun|caiyun)\.139\.com/i],
  ["115", /115cdn\.com|115\.com/i],
  ["PIKPAK", /mypikpak\.com/i],
  ["123", /(?:123684|123865|123912|123pan)\.(?:com|cn)/i],
  ["MAGNET", /^magnet:\?/i],
  ["ED2K", /^ed2k:\/\//i],
];

const REMAN_DISK_SERVICE = {
  BDY: "BAIDU",
  BAIDU: "BAIDU",
  QUARK: "QUARK",
  ALY: "ALIYUN",
  ALIYUN: "ALIYUN",
  XUNLEI: "XUNLEI",
  UC: "UC",
  115: "115",
};

export const getExternalPanSourceConfigs = () => [
  {
    id: "panclub-quark",
    label: "PanClub 夸克",
    type: "panClubDetail",
    baseUrl: "https://pan.club",
    searchUrl: (searchTerm) =>
      `https://pan.club/s/0/0/1/${encodeURIComponent(searchTerm)}/`,
  },
  {
    id: "panclub-baidu",
    label: "PanClub 百度",
    type: "panClubDetail",
    baseUrl: "https://pan.club",
    searchUrl: (searchTerm) =>
      `https://pan.club/baidu/s/0/0/1/${encodeURIComponent(searchTerm)}/`,
  },
  {
    id: "panclub-alipan",
    label: "PanClub 阿里",
    type: "panClubDetail",
    baseUrl: "https://pan.club",
    searchUrl: (searchTerm) =>
      `https://pan.club/alipan/s/0/0/1/${encodeURIComponent(searchTerm)}/`,
  },
  {
    id: "pikasoo",
    label: "皮卡搜索",
    type: "directAnchors",
    searchUrl: (searchTerm) =>
      `https://www.pikasoo.top/search/?q=${encodeURIComponent(searchTerm)}&pan=all`,
  },
  {
    id: "dapanso",
    label: "大盘搜",
    type: "sequentialTitleLinks",
    searchUrl: (searchTerm) =>
      `https://dapanso.com/search?keyword=${encodeURIComponent(searchTerm)}`,
  },
  {
    id: "duanjuso",
    label: "短剧搜",
    type: "remanApi",
    searchUrl: () => "https://www.duanjuso.cc/v1/search/disk",
    baseUrl: "https://www.duanjuso.cc",
  },
];

const normalizeWhitespace = (value) => String(value || "").replace(/\s+/g, " ").trim();

const stripHtml = (value) => normalizeWhitespace(String(value || "").replace(/<[^>]*>/g, " "));

const normalizeTitle = (value) =>
  stripHtml(value)
    .replace(/^\[[^\]]+网盘\]\s*/i, "")
    .replace(/^🔥.*?🔥\s*/, "")
    .slice(0, 160)
    .trim();

const normalizeForMatch = (value) =>
  stripHtml(value)
    .toLowerCase()
    .replace(/&nbsp;/g, " ")
    .replace(/[\s\-_.()[\]【】《》<>:：|/\\,，。；;'"“”‘’]+/g, "");

const isRelevantTitle = (title, searchTerm) => {
  const normalizedTitle = normalizeForMatch(title);
  const normalizedSearchTerm = normalizeForMatch(searchTerm);

  if (!normalizedTitle || !normalizedSearchTerm) {
    return false;
  }

  if (normalizedTitle.includes(normalizedSearchTerm)) {
    return true;
  }

  const tokens = normalizedSearchTerm.match(/[a-z0-9]{2,}|[\u4e00-\u9fff]{2,}/g) || [];
  return tokens.some((token) => normalizedTitle.includes(token));
};

const normalizeLink = (rawUrl) =>
  String(rawUrl || "")
    .replace(/\\\//g, "/")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/[?&](?:pwd|password)=(?:undefined|null)(?=(?:[&#]|$))/gi, "")
    .trim()
    .replace(/[?&](?=#|$)/g, "")
    .replace(/[\\)\]】'"，。；;]+$/g, "")
    .trim();

const extractPassword = (url, fallback) =>
  normalizeLink(url).match(/[?&](?:pwd|password)=((?!undefined\b|null\b)[A-Za-z0-9]+)/i)?.[1] ||
  stripHtml(fallback).match(/^[A-Za-z0-9]+$/)?.[0] ||
  undefined;

const detectService = (url, fallback) => {
  const service = SERVICE_PATTERNS.find(([, pattern]) => pattern.test(url))?.[0];
  return service || REMAN_DISK_SERVICE[String(fallback || "").toUpperCase()] || "OTHER";
};

const extractCloudLinks = (text, fallbackPassword) => {
  const matches = String(text || "").match(CLOUD_LINK_REGEX) || [];
  const seen = new Set();

  return matches.reduce((links, rawUrl) => {
    const link = normalizeLink(rawUrl);
    if (!link || seen.has(link)) {
      return links;
    }

    seen.add(link);
    const pwd = extractPassword(link, fallbackPassword);
    const item = {
      service: detectService(link),
      link,
    };

    if (pwd) {
      item.pwd = pwd;
    }

    links.push(item);
    return links;
  }, []);
};

const addLink = (items, name, link) => {
  const title = normalizeTitle(name);
  if (!title || !link?.link) {
    return;
  }

  const existing = items.find((item) => item.name === title);
  if (!existing) {
    items.push({ name: title, links: [link] });
    return;
  }

  if (
    !existing.links.some(
      (item) => item.link === link.link && item.pwd === link.pwd && item.service === link.service,
    )
  ) {
    existing.links.push(link);
  }
};

const mergeItems = (items, limit = DEFAULT_LIMIT) => {
  const grouped = [];

  items.forEach((item) => {
    (item.links || []).forEach((link) => addLink(grouped, item.name, link));
  });

  return grouped.filter((item) => item.links.length > 0).slice(0, limit);
};

export const parseDirectAnchorResults = (html, searchTerm) => {
  const $ = cheerio.load(html || "");
  const items = [];

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href") || "";
    const links = extractCloudLinks(href);
    const title = normalizeTitle($(element).text());

    if (!links.length || !isRelevantTitle(title, searchTerm)) {
      return;
    }

    items.push({ name: title, links });
  });

  return mergeItems(items);
};

export const parseSequentialTitleLinkResults = (html, searchTerm) => {
  const $ = cheerio.load(html || "");
  const items = [];
  let currentTitle = "";

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href") || "";
    const links = extractCloudLinks(href);
    const text = normalizeTitle($(element).text());

    if (!links.length) {
      currentTitle = text && isRelevantTitle(text, searchTerm) ? text : "";
      return;
    }

    if (!currentTitle) {
      return;
    }

    items.push({ name: currentTitle, links });
    currentTitle = "";
  });

  return mergeItems(items);
};

export const parsePanClubSearchResults = (html, searchTerm, baseUrl) => {
  const $ = cheerio.load(html || "");
  const detailPages = [];
  const seen = new Set();

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href") || "";
    const title = normalizeTitle($(element).text());

    if (
      !/^\/(?:baidu\/|alipan\/)?file\/[^/]+\/$/i.test(href) ||
      !isRelevantTitle(title, searchTerm) ||
      seen.has(href)
    ) {
      return;
    }

    seen.add(href);
    detailPages.push({
      name: title,
      detailUrl: new URL(href, baseUrl).href,
    });
  });

  return detailPages.slice(0, PANCLUB_DETAIL_LIMIT);
};

const parsePanClubDetailResults = (html, title) => {
  const links = extractCloudLinks(html);
  return links.length > 0 ? [{ name: title, links }] : [];
};

export const parseRemanApiResults = (responseText, searchTerm) => {
  const response = JSON.parse(responseText || "{}");
  const list = Array.isArray(response?.data?.list) ? response.data.list : [];
  const items = [];

  list.forEach((item) => {
    const name = normalizeTitle(item.disk_name || item.title || "");
    const searchableText = `${name} ${stripHtml(item.files || "")}`;
    const link = normalizeLink(item.link || "");

    if (!link || !isRelevantTitle(searchableText, searchTerm)) {
      return;
    }

    addLink(items, name || searchTerm, {
      service: detectService(link, item.disk_type),
      link,
      ...(item.disk_pass ? { pwd: String(item.disk_pass).trim() } : {}),
    });
  });

  return mergeItems(items);
};

const buildRemanRequest = (searchTerm) => ({
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    page: 1,
    q: searchTerm,
    user: "",
    exact: false,
    user_distinct: false,
    format: [],
    share_time: "",
    share_year: "",
    size: 12,
    order: "",
    type: "",
    search_ticket: "",
    exclude_user: [],
    adv_params: {
      wechat_pwd: "",
      search_code: "",
      platform: "pc",
      fp_data: "",
      automated: "0",
    },
  }),
});

const defaultFetchText = async (url, options = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: options.method || "GET",
      body: options.body,
      signal: controller.signal,
      headers: {
        "User-Agent": DEFAULT_USER_AGENT,
        Accept: "text/html,application/json,text/plain,*/*",
        Referer: options.referer || url,
        Origin: options.origin || new URL(url).origin,
        ...(options.headers || {}),
      },
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`.trim());
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
};

const runAdapter = async (source, searchTerm) => {
  const fetchText = source.fetchText || defaultFetchText;
  const searchUrl = source.searchUrl(searchTerm);

  if (source.type === "directAnchors") {
    const html = await fetchText(searchUrl, { referer: source.baseUrl || searchUrl });
    return parseDirectAnchorResults(html, searchTerm);
  }

  if (source.type === "sequentialTitleLinks") {
    const html = await fetchText(searchUrl, { referer: source.baseUrl || searchUrl });
    return parseSequentialTitleLinkResults(html, searchTerm);
  }

  if (source.type === "remanApi") {
    const request = buildRemanRequest(searchTerm);
    const responseText = await fetchText(searchUrl, {
      ...request,
      referer: `${source.baseUrl}/search?q=${encodeURIComponent(searchTerm)}`,
      origin: source.baseUrl,
    });
    return parseRemanApiResults(responseText, searchTerm);
  }

  if (source.type === "panClubDetail") {
    const html = await fetchText(searchUrl, { referer: source.baseUrl });
    const details = parsePanClubSearchResults(html, searchTerm, source.baseUrl);
    const detailResults = await Promise.allSettled(
      details.map(async (detail) => {
        const detailHtml = await fetchText(detail.detailUrl, {
          referer: searchUrl,
          timeoutMs: DEFAULT_TIMEOUT_MS,
        });
        return parsePanClubDetailResults(detailHtml, detail.name);
      }),
    );

    return detailResults
      .filter((result) => result.status === "fulfilled")
      .flatMap((result) => result.value);
  }

  return [];
};

export const buildExternalPanSearchResult = async (
  searchTerm,
  sources = getExternalPanSourceConfigs(),
) => {
  const settled = await Promise.allSettled(
    sources.map(async (source) => ({
      source,
      items: await runAdapter(source, searchTerm),
    })),
  );
  const errors = [];
  const items = [];

  settled.forEach((result) => {
    if (result.status === "fulfilled") {
      items.push(...result.value.items);
      return;
    }

    errors.push(result.reason?.message || "unknown error");
  });

  const list = mergeItems(items, DEFAULT_LIMIT);

  return {
    list,
    code: list.length > 0 ? 200 : errors.length === sources.length ? 502 : 206,
    msg:
      list.length > 0
        ? "success"
        : errors[0] || "未找到相关资源",
  };
};
