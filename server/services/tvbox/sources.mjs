import * as cheerio from "cheerio";

export const TVBOX_STRUCTURED_GROUPS = Object.freeze([
  {
    id: "single",
    label: "单仓源",
    url: "https://www.juwanhezi.com/other/jsonlist?type=one",
    parser: "structured",
  },
  {
    id: "warehouse",
    label: "多仓源",
    url: "https://www.juwanhezi.com/other/jsonlist?type=many",
    parser: "structured",
  },
  {
    id: "package",
    label: "本地包",
    url: "https://www.juwanhezi.com/other/jsonlist?type=local",
    parser: "structured",
  },
]);

export const TVBOX_DISCOVERY_GROUPS = Object.freeze([
  {
    id: "yxzhi",
    type: "discovery",
    label: "扩展源",
    url: "https://www.yxzhi.com/9257.html",
    parser: "article",
  },
  {
    id: "yinghezhinan",
    type: "discovery",
    label: "扩展源",
    url: "https://yinghezhinan.com/tvbox-jsonlist/",
    parser: "article",
  },
]);

export const TVBOX_SOURCE_GROUPS = Object.freeze([
  ...TVBOX_STRUCTURED_GROUPS,
  ...TVBOX_DISCOVERY_GROUPS,
]);

const REQUEST_HEADERS = Object.freeze({
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  Referer: "https://www.juwanhezi.com/",
});

const SOURCE_LINK_PATTERN = /^https?:\/\//i;
const URL_PATTERN = /https?:\/\/[^\s"'<>，。；、)）\]]+/gi;
const NON_SOURCE_EXT_PATTERN =
  /\.(?:avif|css|gif|ico|jpeg|jpg|js|png|svg|webp)(?:[?#].*)?$/i;
const DISCOVERY_PAGE_HOSTS = new Set(["www.yxzhi.com", "yxzhi.com", "yinghezhinan.com"]);

const normalizeSpace = (value) => String(value || "").replace(/\s+/g, " ").trim();

const decodeHtml = (value) => cheerio.load(`<span>${value || ""}</span>`)("span").text();

const normalizeLinkKey = (value) => normalizeSpace(value).toLowerCase();

const isSourceLink = (value) => SOURCE_LINK_PATTERN.test(normalizeSpace(value));

const stripTrailingPunctuation = (value) =>
  normalizeSpace(value).replace(/[.,;，。；、]+$/g, "");

const getSourceType = (group) => group.type || group.id;

const cleanName = (name, fallback) => {
  const normalized = normalizeSpace(decodeHtml(name));
  return normalized || fallback;
};

const cleanLink = (link) => normalizeSpace(decodeHtml(link));

const createSourceItem = ({ name, link, group, index }) => ({
  name,
  link,
  sourceType: getSourceType(group),
  sourceTypeLabel: group.label,
  upstream: group.url,
  id: `${getSourceType(group)}-${index + 1}`,
});

const isProbablySourceUrl = (value) => {
  const cleaned = cleanLink(stripTrailingPunctuation(value));
  if (!isSourceLink(cleaned) || NON_SOURCE_EXT_PATTERN.test(cleaned)) {
    return false;
  }

  try {
    const parsedUrl = new URL(cleaned);
    const host = parsedUrl.hostname.replace(/^www\./, "");
    const path = decodeURIComponent(parsedUrl.pathname || "");

    if (DISCOVERY_PAGE_HOSTS.has(parsedUrl.hostname) || DISCOVERY_PAGE_HOSTS.has(host)) {
      return false;
    }

    if (!path || path === "/") {
      return /肥猫|饭太硬|cainisi|nxog|tvbox|box|tv/i.test(
        `${parsedUrl.hostname}${path}${cleaned}`,
      );
    }

    return !/\/(?:article|site|sitetag|sites)\//i.test(path);
  } catch (error) {
    return /[\u4e00-\u9fa5]/.test(cleaned);
  }
};

const cleanArticleName = (line, urls, fallback) => {
  const withoutUrls = urls.reduce(
    (value, url) => value.replace(url, ""),
    decodeHtml(line),
  );
  const normalized = normalizeSpace(
    withoutUrls
      .replace(/[：:]+$/g, "")
      .replace(/^[#>*\-\d.\s]+/g, "")
      .replace(/`/g, ""),
  );

  if (
    normalized &&
    normalized.length <= 36 &&
    !/^(复制|下载|一键复制|配置地址|使用方法|最新配置线路推荐)$/i.test(normalized)
  ) {
    return normalized;
  }

  return fallback;
};

export const parseUpdatedAt = (html) => {
  const match = String(html || "").match(/更新时间[：:]\s*([0-9-]+)/);
  return match?.[1] || "";
};

export const parseTvboxSourceHtml = (html, group) => {
  const $ = cheerio.load(String(html || ""));
  const items = [];
  const seen = new Set();

  const addItem = (name, link) => {
    const cleanedLink = cleanLink(link);
    if (!isSourceLink(cleanedLink)) return;

    const key = normalizeLinkKey(cleanedLink);
    if (seen.has(key)) return;
    seen.add(key);

    items.push(
      createSourceItem({
        name: cleanName(name, `${group.label}${items.length + 1}`),
        link: cleanedLink,
        group,
        index: items.length,
      })
    );
  };

  $("label").each((_, label) => {
    const labelEl = $(label);
    const container = labelEl.closest("li, tr, .form-group, .input-group, div");
    const input =
      container.find("input[value]").first().attr("value") ||
      labelEl.nextAll("input[value]").first().attr("value") ||
      labelEl.nextAll().find("input[value]").first().attr("value");

    addItem(labelEl.text(), input);
  });

  const pattern =
    /<label[^>]*>([\s\S]*?)<\/label>[\s\S]{0,1200}?<input[^>]*value=(["'])(.*?)\2/gi;
  for (const match of String(html || "").matchAll(pattern)) {
    addItem(match[1].replace(/<[^>]+>/g, ""), match[3]);
  }

  return items;
};

export const parseTvboxArticleHtml = (html, group) => {
  const $ = cheerio.load(String(html || ""));
  $("script, style, noscript, svg, img, header, footer, nav, form").remove();

  const lines = $("body")
    .text()
    .split(/\n+/)
    .map((line) => normalizeSpace(line))
    .filter(Boolean);

  const items = [];
  const seen = new Set();
  let previousLabel = "";

  const addItem = (name, link) => {
    const cleanedLink = cleanLink(stripTrailingPunctuation(link));
    if (!isProbablySourceUrl(cleanedLink)) return;

    const key = normalizeLinkKey(cleanedLink);
    if (!key || seen.has(key)) return;
    seen.add(key);

    items.push(
      createSourceItem({
        name: cleanName(name, `${group.label}${items.length + 1}`),
        link: cleanedLink,
        group,
        index: items.length,
      })
    );
  };

  for (const line of lines) {
    const urls = [...line.matchAll(URL_PATTERN)].map((match) => match[0]);
    if (urls.length) {
      const name = cleanArticleName(line, urls, previousLabel);
      urls.forEach((url) => addItem(name, url));
      continue;
    }

    if (
      line.length <= 36 &&
      !/[。！？?]/.test(line) &&
      !/^(首页|更多|投稿|帮助|广告|免责声明|隐私政策|使用方法|相关文章)$/.test(line)
    ) {
      previousLabel = line;
    }
  }

  return items;
};

export const mergeTvboxSourceGroups = (groupResults) => {
  const merged = [];
  const seen = new Set();

  for (const result of groupResults) {
    for (const item of result.list || []) {
      const key = normalizeLinkKey(item.link);
      if (!key || seen.has(key)) continue;

      seen.add(key);
      merged.push({
        ...item,
        id: `${item.sourceType}-${merged.length + 1}`,
      });
    }
  }

  return merged;
};

export const fetchTvboxSources = async (fetcher) => {
  if (typeof fetcher !== "function") {
    throw new TypeError("fetchTvboxSources requires a fetcher function");
  }

  const settled = await Promise.allSettled(
    TVBOX_SOURCE_GROUPS.map(async (group) => {
      const html = await fetcher(group.url, {
        headers: REQUEST_HEADERS,
        timeout: 15000,
        responseType: "text",
      });
      const body = typeof html === "string" ? html : String(html || "");
      const parser =
        group.parser === "article" ? parseTvboxArticleHtml : parseTvboxSourceHtml;

      return {
        group: {
          id: group.id,
          type: getSourceType(group),
          label: group.label,
          url: group.url,
        },
        updatedAt: parseUpdatedAt(body),
        list: parser(body, group),
      };
    })
  );

  const groups = [];
  const errors = [];

  settled.forEach((result, index) => {
    const group = TVBOX_SOURCE_GROUPS[index];
    if (result.status === "fulfilled") {
      groups.push(result.value);
      return;
    }

    errors.push({
      id: group.id,
      label: group.label,
      url: group.url,
      message:
        result.reason instanceof Error
          ? result.reason.message
          : String(result.reason),
    });
  });

  const list = mergeTvboxSourceGroups(groups);

  return {
    list,
    meta: {
      total: list.length,
      fetchedAt: new Date().toISOString(),
      groups: groups.map((result) => ({
        id: result.group.id,
        label: result.group.label,
        url: result.group.url,
        updatedAt: result.updatedAt,
        count: result.list.length,
      })),
      failedGroups: errors,
    },
  };
};
