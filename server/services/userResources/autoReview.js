import { normalizeLinks, normalizeSourceName } from "../search/source1Results.js";
import {
  evaluateContentModeration,
  MODERATION_CONTEXTS,
} from "../moderation/policy.mjs";

const SUPPORTED_HTTP_SERVICE_HOSTS = {
  BAIDU: ["pan.baidu.com"],
  XUNLEI: ["pan.xunlei.com"],
  QUARK: ["pan.quark.cn"],
  ALIYUN: ["aliyundrive.com", "alipan.com"],
  UC: ["pan.uc.cn"],
  TIANYI: ["cloud.189.cn"],
  MOBILE: ["caiyun.139.com"],
  "115": ["115.com"],
  PIKPAK: ["mypikpak.com"],
  "123": ["123pan.com"],
};

const NON_HTTP_SERVICES = new Set(["MAGNET", "ED2K"]);
const UNSAFE_HOSTS = new Set(["localhost", "localhost.localdomain"]);
const INVALID_SHARE_PATTERNS = [
  "分享已失效",
  "链接已失效",
  "链接不存在",
  "文件不存在",
  "资源不存在",
  "分享不存在",
  "分享的文件已经被取消",
  "分享已被取消",
  "该分享已取消",
  "已被删除",
  "not found",
  "has expired",
  "share expired",
  "share does not exist",
];

const normalizeComparableName = (value) =>
  normalizeSourceName(value).toLowerCase();

const normalizeComparableLink = (value) =>
  String(value || "")
    .trim()
    .replace(/\/+$/, "")
    .toLowerCase();

const normalizeHost = (hostname) =>
  String(hostname || "")
    .trim()
    .replace(/\.$/, "")
    .toLowerCase();

const isPrivateIPv4 = (hostname) => {
  const parts = hostname.split(".").map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) {
    return false;
  }

  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
};

const hostMatches = (hostname, allowedHosts = []) =>
  allowedHosts.some((allowedHost) => {
    const normalizedAllowedHost = normalizeHost(allowedHost);
    return (
      hostname === normalizedAllowedHost ||
      hostname.endsWith(`.${normalizedAllowedHost}`)
    );
  });

const addIndexEntry = (map, key, entry) => {
  if (!key) {
    return;
  }

  if (!map.has(key)) {
    map.set(key, []);
  }
  map.get(key).push(entry);
};

const buildEntry = (resource, source) => ({
  source,
  id: resource.id,
  name: resource.name,
});

const buildDuplicateIndex = (resources = [], source) => {
  const names = new Map();
  const links = new Map();

  for (const resource of resources) {
    const entry = buildEntry(resource, source);
    addIndexEntry(names, normalizeComparableName(resource.name), entry);

    for (const link of normalizeLinks(resource.links)) {
      addIndexEntry(links, normalizeComparableLink(link.link), entry);
    }
  }

  return { names, links };
};

const mergeDuplicateIndexes = (...indexes) => {
  const merged = { names: new Map(), links: new Map() };

  for (const index of indexes) {
    for (const [key, entries] of index.names) {
      for (const entry of entries) {
        addIndexEntry(merged.names, key, entry);
      }
    }

    for (const [key, entries] of index.links) {
      for (const entry of entries) {
        addIndexEntry(merged.links, key, entry);
      }
    }
  }

  return merged;
};

const isSameResource = (entry, resource) =>
  entry.source === "userResource" && entry.id === resource.id;

const getDuplicateEntries = (map, key, resource) =>
  (map.get(key) || []).filter((entry) => !isSameResource(entry, resource));

export function buildUserResourceAuditContext({
  storedResources = [],
  publishedUserResources = [],
  pendingUserResources = [],
} = {}) {
  return mergeDuplicateIndexes(
    buildDuplicateIndex(storedResources, "resource"),
    buildDuplicateIndex(publishedUserResources, "userResource"),
    buildDuplicateIndex(pendingUserResources, "userResource")
  );
}

export function isSafeShareUrl(link) {
  if (NON_HTTP_SERVICES.has(link.service)) {
    return true;
  }

  let url;
  try {
    url = new URL(link.link);
  } catch {
    return false;
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    return false;
  }

  const hostname = normalizeHost(url.hostname);
  if (
    !hostname ||
    UNSAFE_HOSTS.has(hostname) ||
    isPrivateIPv4(hostname) ||
    hostname.includes(":")
  ) {
    return false;
  }

  return hostMatches(hostname, SUPPORTED_HTTP_SERVICE_HOSTS[link.service]);
}

export async function checkShareLinkAvailability(link, options = {}) {
  if (NON_HTTP_SERVICES.has(link.service)) {
    return {
      status: "skipped",
      reachable: null,
      message: "非HTTP链接无法自动确认是否存在",
    };
  }

  if (!isSafeShareUrl(link)) {
    return {
      status: "invalid",
      reachable: false,
      message: "链接域名不在支持的网盘白名单内",
    };
  }

  const timeoutMs = Number.parseInt(options.timeoutMs, 10) || 8000;

  try {
    const response = await fetch(link.link, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; AipanBot/1.0; +https://aipan.me)",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    const contentType = response.headers.get("content-type") || "";
    const sample = contentType.includes("text")
      ? (await response.text()).slice(0, 12000).toLowerCase()
      : "";

    if (
      sample &&
      INVALID_SHARE_PATTERNS.some((pattern) =>
        sample.includes(pattern.toLowerCase())
      )
    ) {
      return {
        status: "invalid",
        reachable: false,
        statusCode: response.status,
        message: "页面内容提示分享不存在或已失效",
      };
    }

    if (response.status >= 400 && response.status !== 403) {
      return {
        status: "invalid",
        reachable: false,
        statusCode: response.status,
        message: `访问返回HTTP ${response.status}`,
      };
    }

    if (response.status === 403) {
      return {
        status: "unknown",
        reachable: null,
        statusCode: response.status,
        message: "目标网盘拒绝自动访问，需要人工复核",
      };
    }

    return {
      status: "reachable",
      reachable: true,
      statusCode: response.status,
      message: "链接可访问",
    };
  } catch (error) {
    return {
      status: "unknown",
      reachable: null,
      message: error?.name === "TimeoutError" ? "链接检查超时" : "链接检查失败",
    };
  }
}

export async function evaluateUserResourceForAutoReview(
  resource,
  context,
  options = {}
) {
  const checks = [];
  const linkChecks = [];
  const minNameLength = Number.parseInt(options.minNameLength, 10) || 2;
  const minDescriptionLength =
    Number.parseInt(options.minDescriptionLength, 10) || 2;
  const maxLinks = Number.parseInt(options.maxLinks, 10) || 5;
  const requireReachable = Boolean(options.requireReachable);
  const linkChecker = options.linkChecker || checkShareLinkAvailability;

  const addCheck = (code, passed, message, severity = "error") => {
    checks.push({ code, passed, message, severity });
  };

  const name = normalizeSourceName(resource.name);
  const description = normalizeSourceName(resource.description);
  const links = normalizeLinks(resource.links);
  const moderation = evaluateContentModeration(`${name}\n${description}`, {
    context: MODERATION_CONTEXTS.userResource,
    config: options.moderationConfig,
  });

  addCheck(
    "status_pending",
    resource.status === "pending",
    "只自动审核待审核资源"
  );
  addCheck(
    "name_required",
    name.length >= minNameLength,
    `资源名称至少${minNameLength}个字符`
  );
  addCheck(
    "description_required",
    description.length >= minDescriptionLength,
    `资源描述至少${minDescriptionLength}个字符`
  );
  if (moderation.action !== "allow") {
    addCheck(
      "content_moderation",
      false,
      moderation.message || "资源名称或描述包含敏感信息",
      moderation.risk === "high" ? "error" : "warning"
    );
  } else {
    addCheck("content_moderation", true, "资源名称和描述未命中敏感策略");
  }
  addCheck("type_exists", Boolean(resource.type), "资源类型必须存在");
  addCheck(
    "type_enabled",
    resource.type?.isEnabled !== false,
    "资源类型必须启用"
  );
  addCheck("links_required", links.length > 0, "至少需要一个资源链接");
  addCheck(
    "links_limit",
    links.length <= maxLinks,
    `资源链接不能超过${maxLinks}个`
  );

  const titleDuplicates = getDuplicateEntries(
    context.names,
    normalizeComparableName(name),
    resource
  );
  addCheck(
    "title_duplicate",
    titleDuplicates.length === 0,
    titleDuplicates.length
      ? `资源名称已存在：${titleDuplicates
          .map((item) => `${item.source}#${item.id}`)
          .join(", ")}`
      : "资源名称未重复"
  );

  for (const link of links) {
    const linkKey = normalizeComparableLink(link.link);
    const duplicateLinks = getDuplicateEntries(context.links, linkKey, resource);
    const serviceHosts = SUPPORTED_HTTP_SERVICE_HOSTS[link.service];
    const supported =
      NON_HTTP_SERVICES.has(link.service) || Boolean(serviceHosts?.length);
    const safe = supported && isSafeShareUrl(link);

    linkChecks.push({
      link: link.link,
      service: link.service,
      status: safe ? "format_valid" : "format_invalid",
      reachable: null,
      message: safe ? "链接格式有效" : "链接格式或网盘类型不支持",
    });

    addCheck(
      `link_format:${linkKey}`,
      safe,
      `链接格式或网盘类型不支持：${link.link}`
    );
    addCheck(
      `link_duplicate:${linkKey}`,
      duplicateLinks.length === 0,
      duplicateLinks.length
        ? `资源链接已存在：${duplicateLinks
            .map((item) => `${item.source}#${item.id}`)
            .join(", ")}`
        : "资源链接未重复"
    );

    if (requireReachable && safe) {
      const availability = await linkChecker(link, options);
      linkChecks.push({
        link: link.link,
        service: link.service,
        ...availability,
      });

      if (availability.reachable === false) {
        addCheck(
          `link_exists:${linkKey}`,
          false,
          `资源链接不可用：${availability.message}`
        );
      } else if (availability.reachable === null) {
        addCheck(
          `link_exists:${linkKey}`,
          false,
          `资源链接需要人工确认：${availability.message}`,
          "warning"
        );
      } else {
        addCheck(`link_exists:${linkKey}`, true, "资源链接可访问");
      }
    }
  }

  const failedErrors = checks.filter(
    (check) => !check.passed && check.severity === "error"
  );
  const warnings = checks.filter(
    (check) => !check.passed && check.severity === "warning"
  );
  const canAutoApprove = failedErrors.length === 0 && warnings.length === 0;

  return {
    resourceId: resource.id,
    name,
    status: resource.status,
    canAutoApprove,
    shouldReject: failedErrors.length > 0,
    needsManualReview: warnings.length > 0,
    checks,
    linkChecks,
  };
}
