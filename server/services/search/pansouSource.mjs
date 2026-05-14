export const DEFAULT_PANSOU_INSTANCE_URLS = [
  "https://so.252035.xyz/api/search",
  "https://pansou.aipan.me/api/search",
  "https://pansou.app/api/search",
];

export const DEFAULT_PANSOU_CLOUD_TYPES = [
  "baidu",
  "aliyun",
  "quark",
  "guangya",
  "tianyi",
  "uc",
  "mobile",
  "115",
  "pikpak",
  "xunlei",
  "123",
  "magnet",
  "ed2k",
];

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36";

const SERVICE_MAPPING = {
  baidu: "BAIDU",
  xunlei: "XUNLEI",
  quark: "QUARK",
  guangya: "GUANGYA",
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

const normalizeWhitespace = (value) => String(value || "").replace(/\s+/g, " ").trim();

const parseList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseInteger = (value, fallback, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, min), max);
};

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (typeof value === "boolean") {
    return value;
  }

  return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
};

const normalizePansouApiUrl = (rawUrl) => {
  const trimmed = String(rawUrl || "").trim();
  if (!trimmed) {
    return "";
  }

  try {
    const url = new URL(trimmed);
    url.hash = "";
    url.search = "";
    url.pathname = url.pathname.replace(/\/+$/, "");

    if (!url.pathname || url.pathname === "/") {
      url.pathname = "/api/search";
    }

    return url.toString().replace(/\/$/, "");
  } catch {
    return trimmed.replace(/\/+$/, "");
  }
};

export const resolvePansouInstanceUrls = (config = {}) => {
  const configuredUrls = parseList(config.pansouApiUrls).map(normalizePansouApiUrl).filter(Boolean);
  const sourceUrls = configuredUrls.length > 0 ? configuredUrls : DEFAULT_PANSOU_INSTANCE_URLS;

  return Array.from(new Set(sourceUrls));
};

export const getPansouMaxResults = (config = {}) =>
  parseInteger(config.pansouMaxResults, 120, { min: 1, max: 300 });

const normalizeTitle = (note, searchTerm) => {
  const headline = String(note || "").split(/(?:描述|链接)[:：]/)[0] || note;
  const firstLine = String(headline || "").split(/\n/)[0] || headline;
  const cleanedTitle = String(firstLine || "")
    .replace(/^名称[:：]\s*/i, "")
    .replace(
      /^【|】$|🗄｜🔥|✅|🀄|🔴|🟢|💖|❤️|💚|💛|🍄|🔶|◀|▉|▶|━|─|＞|｜|📽️|🎞️|🏠|%%|⚡|🌟|⭐|🎬|🎥|🎯|🎪|🎭|🎨|🎤|🎵|🎶/g,
      "",
    );

  return normalizeWhitespace(cleanedTitle || searchTerm);
};

const normalizeLink = (url) =>
  String(url || "")
    .replace(/&amp;/g, "&")
    .trim()
    .replace(/[.,，。；;]+$/, "");

export const buildPansouSearchRequest = (apiUrl, searchTerm, config = {}) => {
  const cloudTypes = parseList(config.pansouCloudTypes);
  const plugins = parseList(config.pansouPlugins);
  const channels = parseList(config.pansouChannels);
  const authToken = String(config.pansouAuthToken || "").trim();

  const body = {
    kw: searchTerm,
    refresh: parseBoolean(config.pansouRefresh, false),
    res: String(config.pansouResultMode || "merge").trim() || "merge",
    src: String(config.pansouSourceMode || "all").trim() || "all",
  };

  if (cloudTypes.length > 0) {
    body.cloud_types = cloudTypes;
  }

  if (plugins.length > 0) {
    body.plugins = plugins;
  }

  if (channels.length > 0) {
    body.channels = channels;
  }

  const headers = {
    "User-Agent": DEFAULT_USER_AGENT,
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  return {
    url: normalizePansouApiUrl(apiUrl),
    options: {
      method: "POST",
      body,
      timeout: parseInteger(config.pansouRequestTimeoutMs, 15000, {
        min: 1000,
        max: 60000,
      }),
      headers,
    },
  };
};

export const fetchPansouInstance = async ($fetch, apiUrl, searchTerm, config = {}) => {
  const request = buildPansouSearchRequest(apiUrl, searchTerm, config);
  return await $fetch(request.url, request.options);
};

export const transformPansouResponses = (responses, searchTerm, options = {}) => {
  const grouped = new Map();
  const globalLinkIndex = new Map();
  const searchTermLower = String(searchTerm || "").toLowerCase();
  const maxResults = parseInteger(options.maxResults, 120, { min: 1, max: 300 });

  responses.forEach((response) => {
    Object.entries(response?.data?.merged_by_type || {}).forEach(([type, items]) => {
      if (!items?.length) {
        return;
      }

      const service = SERVICE_MAPPING[type] || "OTHER";

      items.forEach((item) => {
        const title = normalizeTitle(item?.note || "", searchTerm);
        const rawText = `${title} ${item?.note || ""}`.toLowerCase();
        if (!title || !rawText.includes(searchTermLower)) {
          return;
        }

        const link = normalizeLink(item?.url || "");
        if (!link) {
          return;
        }

        const pwd = item?.password || undefined;
        const linkKey = `${service}|${link}|${pwd || ""}`;
        const groupKey = globalLinkIndex.get(linkKey) || title;

        if (!grouped.has(groupKey)) {
          grouped.set(groupKey, {
            name: groupKey,
            links: [],
          });
        }

        const current = grouped.get(groupKey);
        const duplicate = current.links.some(
          (existing) =>
            existing.service === service &&
            existing.link === link &&
            existing.pwd === pwd,
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
    .slice(0, maxResults);

  return {
    list,
    code: list.length > 0 ? 200 : 206,
    msg: list.length > 0 ? "success" : "未找到相关资源",
  };
};
