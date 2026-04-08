export type LinkService =
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

export const LINK_SERVICE_NAMES: Record<LinkService, string> = {
  ALIYUN: "阿里云盘",
  QUARK: "夸克网盘",
  BAIDU: "百度网盘",
  XUNLEI: "迅雷网盘",
  UC: "UC网盘",
  "115": "115网盘",
  TIANYI: "天翼云盘",
  MOBILE: "移动云盘",
  PIKPAK: "PikPak",
  "123": "123网盘",
  MAGNET: "磁力链接",
  ED2K: "电驴链接",
  OTHER: "外部链接",
};

const SERVICE_PATTERNS: Array<{ service: LinkService; pattern: RegExp }> = [
  { service: "BAIDU", pattern: /https?:\/\/pan\.baidu\.com\/s\/[A-Za-z0-9_-]+(?:\?pwd=[A-Za-z0-9]+)?/i },
  { service: "XUNLEI", pattern: /https?:\/\/pan\.xunlei\.com\/s\/[A-Za-z0-9_-]+(?:\?pwd=[A-Za-z0-9]+)?#?/i },
  { service: "QUARK", pattern: /https?:\/\/pan\.quark\.cn\/s\/[A-Za-z0-9]+/i },
  { service: "ALIYUN", pattern: /https?:\/\/(?:www\.)?(?:aliyundrive|alipan)\.com\/s\/[A-Za-z0-9]+/i },
  { service: "UC", pattern: /https?:\/\/drive\.uc\.cn\/s\/[A-Za-z0-9]+(?:\?public=1)?/i },
  { service: "TIANYI", pattern: /https?:\/\/cloud\.189\.cn\/(?:t\/|web\/share\?code=)[^"\\\s]+/i },
  { service: "MOBILE", pattern: /https?:\/\/(?:caiyun|yun)\.139\.com\/(?:m\/i\?|w\/i\/)[^"\\\s]+/i },
  { service: "115", pattern: /https?:\/\/115cdn\.com\/s\/[A-Za-z0-9]+(?:\?password=[A-Za-z0-9]+)?/i },
  { service: "PIKPAK", pattern: /https?:\/\/mypikpak\.com\/s\/[^"\\\s]+/i },
  { service: "123", pattern: /https?:\/\/(?:www\.)?(?:123684|123865|123912|123pan)\.(?:com|cn)\/s\/[^?"\\\s]+/i },
  { service: "MAGNET", pattern: /magnet:\?[^"\\\s]+/i },
  { service: "ED2K", pattern: /ed2k:\/\/[^"\\\s]+/i },
];

export const CLOUD_DRIVE_SERVICES = new Set<LinkService>([
  "BAIDU",
  "XUNLEI",
  "QUARK",
  "ALIYUN",
  "UC",
  "TIANYI",
  "MOBILE",
  "115",
  "PIKPAK",
  "123",
]);

export const DIRECT_PROTOCOL_SERVICES = new Set<LinkService>(["MAGNET", "ED2K"]);

export const normalizeLinkService = (service?: string | null): LinkService => {
  if (!service) {
    return "OTHER";
  }

  const normalized = String(service).toUpperCase();
  if (normalized in LINK_SERVICE_NAMES) {
    return normalized as LinkService;
  }

  return "OTHER";
};

export const detectLinkService = (
  link?: string | null,
  fallbackService?: string | null
): LinkService => {
  const fallback = normalizeLinkService(fallbackService);
  if (!link) {
    return fallback;
  }

  const matched = SERVICE_PATTERNS.find(({ pattern }) => pattern.test(link));
  return matched?.service || fallback;
};

export const getLinkServiceName = (service?: string | null): string => {
  const normalized = normalizeLinkService(service);
  return LINK_SERVICE_NAMES[normalized] || LINK_SERVICE_NAMES.OTHER;
};

export const isDirectProtocolLink = (link?: string | null): boolean => {
  return Boolean(link && /^(magnet:|ed2k:\/\/)/i.test(link));
};

export const isCloudDriveService = (service?: string | null): boolean => {
  return CLOUD_DRIVE_SERVICES.has(normalizeLinkService(service));
};

export const getLinkCategoryName = (service?: string | null): string => {
  const normalized = normalizeLinkService(service);

  if (DIRECT_PROTOCOL_SERVICES.has(normalized)) {
    return "下载协议";
  }

  if (CLOUD_DRIVE_SERVICES.has(normalized)) {
    return "网盘链接";
  }

  return "外部链接";
};
