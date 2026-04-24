const SERVICE_PATTERNS = [
  { pattern: "pan.baidu.com", service: "BAIDU" },
  { pattern: "pan.xunlei.com", service: "XUNLEI" },
  { pattern: "pan.quark.cn", service: "QUARK" },
  { pattern: "aliyundrive.com", service: "ALIYUN" },
  { pattern: "alipan.com", service: "ALIYUN" },
  { pattern: "pan.uc.cn", service: "UC" },
  { pattern: "cloud.189.cn", service: "TIANYI" },
  { pattern: "caiyun.139.com", service: "MOBILE" },
  { pattern: "115.com", service: "115" },
  { pattern: "mypikpak.com", service: "PIKPAK" },
  { pattern: "123pan.com", service: "123" },
  { pattern: "magnet:", service: "MAGNET" },
  { pattern: "ed2k://", service: "ED2K" },
];

const normalizeWhitespace = (value) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim();

export const normalizeSourceName = normalizeWhitespace;

export function normalizeSource1SearchName(body) {
  const normalizedName = normalizeWhitespace(body?.name);
  return normalizedName || undefined;
}

export function detectLinkService(value) {
  const normalizedValue = String(value || "").trim().toLowerCase();

  for (const { pattern, service } of SERVICE_PATTERNS) {
    if (normalizedValue.includes(pattern)) {
      return service;
    }
  }

  return "OTHER";
}

function normalizeSingleLink(link) {
  if (!link) {
    return null;
  }

  if (typeof link === "string") {
    const normalizedLink = link.trim();
    if (!normalizedLink) {
      return null;
    }

    return {
      link: normalizedLink,
      pwd: "",
      service: detectLinkService(normalizedLink),
    };
  }

  const normalizedLink = String(link.link || link.value || link.url || "").trim();
  if (!normalizedLink) {
    return null;
  }

  const normalizedPwd = String(link.pwd || link.password || "").trim();
  const normalizedService = String(
    link.service || detectLinkService(normalizedLink)
  ).toUpperCase();

  return {
    link: normalizedLink,
    pwd: normalizedPwd,
    service: normalizedService,
  };
}

export function normalizeLinks(rawLinks) {
  if (!rawLinks) {
    return [];
  }

  let parsedLinks = rawLinks;
  if (typeof rawLinks === "string") {
    try {
      parsedLinks = JSON.parse(rawLinks);
    } catch {
      return [];
    }
  }

  const linkArray = Array.isArray(parsedLinks) ? parsedLinks : [parsedLinks];

  return linkArray
    .map((link) => normalizeSingleLink(link))
    .filter(Boolean);
}

export function mapStoredResourceToSourceItem(item) {
  return {
    name: normalizeSourceName(item?.name),
    links: normalizeLinks(item?.links),
  };
}

export function mapUserResourceDocumentToSourceItem(document) {
  return {
    name: normalizeSourceName(document?.name),
    links: normalizeLinks(document?.links),
  };
}

export function mergeSourceItems(primaryItems = [], secondaryItems = [], limit = 100) {
  const mergedItems = new Map();
  const orderedKeys = [];

  const appendItems = (items) => {
    for (const item of items) {
      const normalizedName = normalizeSourceName(item?.name);
      if (!normalizedName) {
        continue;
      }

      if (!mergedItems.has(normalizedName)) {
        mergedItems.set(normalizedName, {
          name: normalizedName,
          links: [],
        });
        orderedKeys.push(normalizedName);
      }

      const currentItem = mergedItems.get(normalizedName);
      const existingLinks = new Set(
        currentItem.links.map(
          (link) => `${link.service}|${link.link}|${String(link.pwd || "")}`
        )
      );

      for (const link of normalizeLinks(item?.links)) {
        const linkKey = `${link.service}|${link.link}|${String(link.pwd || "")}`;
        if (existingLinks.has(linkKey)) {
          continue;
        }

        currentItem.links.push(link);
        existingLinks.add(linkKey);
      }
    }
  };

  appendItems(primaryItems);
  appendItems(secondaryItems);

  return orderedKeys
    .slice(0, limit)
    .map((key) => mergedItems.get(key));
}
