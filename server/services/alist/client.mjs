export const ALIST_AUTH_MODES = Object.freeze({
  public: "public",
  password: "password",
  token: "token",
});

const TOKEN_TTL_MS = 47 * 60 * 60 * 1000;

const DEFAULT_LIST_PAGE = 1;
const DEFAULT_LIST_PER_PAGE = 50;

const createAlistServiceError = (message, statusCode = 502, details = undefined) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.statusMessage = message;
  if (details !== undefined) {
    error.details = details;
  }
  return error;
};

const normalizeString = (value) => String(value || "").trim();

export const normalizeAlistBaseUrl = (value) => {
  const raw = normalizeString(value).replace(/\/+$/g, "");

  if (!raw) {
    throw createAlistServiceError("AList 地址不能为空", 400);
  }

  try {
    const parsed = new URL(raw);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("unsupported protocol");
    }
    return parsed.toString().replace(/\/+$/g, "");
  } catch (error) {
    throw createAlistServiceError("AList 地址格式不正确", 400);
  }
};

export const normalizeAlistAuthMode = (value) => {
  const mode = normalizeString(value) || ALIST_AUTH_MODES.public;
  return Object.values(ALIST_AUTH_MODES).includes(mode)
    ? mode
    : ALIST_AUTH_MODES.public;
};

const splitPath = (value) => {
  const raw = normalizeString(value);
  if (!raw || raw === "/") {
    return [];
  }

  return raw
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      if (part === "." || part === "..") {
        throw createAlistServiceError("Invalid AList path", 400);
      }
      return part;
    });
};

export const normalizeAlistPath = (path = "/", rootPath = "/") => {
  const parts = [...splitPath(rootPath), ...splitPath(path)];
  return parts.length ? `/${parts.join("/")}` : "/";
};

const normalizeUserPath = (path = "/") => normalizeAlistPath(path, "/");

const normalizeListPage = (value) => {
  const page = Number(value);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : DEFAULT_LIST_PAGE;
};

const normalizeListPerPage = (value) => {
  const perPage = Number(value);
  return Number.isFinite(perPage) && perPage >= 0
    ? Math.min(Math.floor(perPage), 500)
    : DEFAULT_LIST_PER_PAGE;
};

const getStoredSecret = (config) =>
  normalizeString(config?.secret || config?.password || config?.token);

const getTokenCacheKey = (config) =>
  `${config?.id || "source"}:${normalizeAlistBaseUrl(config?.link)}:${normalizeString(config?.username)}`;

const isTokenFresh = (entry, now) =>
  entry?.token && Number(entry.expiresAt || 0) > now.getTime();

const readFetcherResult = async (result) => {
  if (result && typeof result.json === "function") {
    const data = await result.json().catch(() => null);

    if (result.ok === false) {
      throw createAlistServiceError(
        data?.message || data?.error || "AList 请求失败",
        result.status || 502,
        data,
      );
    }

    return data;
  }

  return result;
};

const callJson = async (fetcher, url, payload, headers = {}) => {
  const result = await fetcher(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(payload),
  });

  return readFetcherResult(result);
};

const assertAListSuccess = (response, fallbackMessage) => {
  if (response?.code === 200) {
    return response.data || {};
  }

  const statusCode = Number(response?.code) === 401 ? 401 : 502;
  throw createAlistServiceError(
    response?.message || fallbackMessage,
    statusCode,
    response,
  );
};

const getManualTokenHeaders = (config) => {
  const token = getStoredSecret(config);
  if (!token) {
    throw createAlistServiceError("AList token 未配置", 400);
  }
  return { Authorization: token };
};

const loginWithPassword = async ({ fetcher, tokenCache, now }, config, forceRefresh = false) => {
  const username = normalizeString(config?.username);
  const password = getStoredSecret(config);

  if (!username || !password) {
    throw createAlistServiceError("AList 用户名或密码未配置", 400);
  }

  const cacheKey = getTokenCacheKey(config);
  const cached = tokenCache.get(cacheKey);
  const currentNow = now();

  if (!forceRefresh && isTokenFresh(cached, currentNow)) {
    return cached.token;
  }

  const baseUrl = normalizeAlistBaseUrl(config.link);
  const data = await callJson(fetcher, `${baseUrl}/api/auth/login`, {
    username,
    password,
  });
  const token = assertAListSuccess(data, "AList 登录失败")?.token;

  if (!token) {
    throw createAlistServiceError("AList 登录未返回 token", 502, data);
  }

  tokenCache.set(cacheKey, {
    token,
    expiresAt: currentNow.getTime() + TOKEN_TTL_MS,
  });

  return token;
};

const getAuthHeaders = async (context, config, forceRefresh = false) => {
  const authMode = normalizeAlistAuthMode(config?.authMode);

  if (authMode === ALIST_AUTH_MODES.public) {
    return {};
  }

  if (authMode === ALIST_AUTH_MODES.token) {
    return getManualTokenHeaders(config);
  }

  const token = await loginWithPassword(context, config, forceRefresh);
  return { Authorization: token };
};

const requestAList = async (context, config, endpoint, payload, retryOnUnauthorized = true) => {
  const baseUrl = normalizeAlistBaseUrl(config.link);
  const headers = await getAuthHeaders(context, config, false);

  try {
    const response = await callJson(context.fetcher, `${baseUrl}${endpoint}`, payload, headers);
    return assertAListSuccess(response, "AList 请求失败");
  } catch (error) {
    if (
      retryOnUnauthorized &&
      error?.statusCode === 401 &&
      normalizeAlistAuthMode(config?.authMode) === ALIST_AUTH_MODES.password
    ) {
      const refreshedHeaders = await getAuthHeaders(context, config, true);
      const response = await callJson(
        context.fetcher,
        `${baseUrl}${endpoint}`,
        payload,
        refreshedHeaders,
      );
      return assertAListSuccess(response, "AList 请求失败");
    }

    throw error;
  }
};

const buildFallbackDownloadUrl = (baseUrl, fullPath, sign) => {
  const encodedPath = splitPath(fullPath).map(encodeURIComponent).join("/");
  const url = `${normalizeAlistBaseUrl(baseUrl)}/d/${encodedPath}`;
  return sign ? `${url}?sign=${encodeURIComponent(sign)}` : url;
};

const joinAlistPath = (base, name) => {
  const parts = [...splitPath(base), ...splitPath(name)];
  return parts.length ? `/${parts.join("/")}` : "/";
};

export const toPublicAlistSource = (source) => {
  const lastCheckedAt = source?.lastCheckedAt
    ? new Date(source.lastCheckedAt).toISOString()
    : null;

  return {
    id: source?.id,
    name: source?.name || "AList",
    link: normalizeString(source?.link),
    authMode: normalizeAlistAuthMode(source?.authMode),
    rootPath: normalizeUserPath(source?.rootPath || "/"),
    enabled: source?.enabled !== false,
    hasCredential: Boolean(source?.secretEncrypted || source?.secret),
    healthStatus: source?.healthStatus || "",
    healthMessage: source?.healthMessage || "",
    lastCheckedAt,
  };
};

export const createAlistClient = (options = {}) => {
  const context = {
    fetcher: options.fetcher || globalThis.fetch,
    tokenCache: options.tokenCache || new Map(),
    now: options.now || (() => new Date()),
  };

  if (typeof context.fetcher !== "function") {
    throw createAlistServiceError("当前运行环境不支持 fetch", 500);
  }

  return {
    async list(config, input = {}) {
      const userPath = normalizeUserPath(input.path || "/");
      const fullPath = normalizeAlistPath(userPath, config?.rootPath || "/");
      const page = normalizeListPage(input.page);
      const perPage = normalizeListPerPage(input.perPage ?? input.per_page);
      const payload = {
        path: fullPath,
        password: normalizeString(input.password),
        page,
        per_page: perPage,
        refresh: Boolean(input.refresh),
      };
      let refreshDenied = false;
      let data;

      try {
        data = await requestAList(context, config, "/api/fs/list", payload);
      } catch (error) {
        if (payload.refresh && /refresh without permission/i.test(error?.message || "")) {
          refreshDenied = true;
          data = await requestAList(context, config, "/api/fs/list", {
            ...payload,
            refresh: false,
          });
        } else {
          throw error;
        }
      }

      const total = Number(data.total || 0);

      return {
        path: userPath,
        fullPath,
        content: Array.isArray(data.content) ? data.content : [],
        total,
        page,
        perPage,
        hasMore: perPage > 0 ? page * perPage < total : false,
        refreshDenied,
        readme: data.readme || "",
        provider: data.provider || "",
      };
    },

    async get(config, input = {}) {
      const userPath = normalizeUserPath(input.path || "/");
      const fullPath = normalizeAlistPath(userPath, config?.rootPath || "/");
      const data = await requestAList(context, config, "/api/fs/get", {
        path: fullPath,
        password: normalizeString(input.password),
      });
      const playUrl = normalizeString(data.raw_url) ||
        buildFallbackDownloadUrl(config.link, fullPath, data.sign);

      return {
        path: userPath,
        fullPath,
        file: data,
        playUrl,
      };
    },

    async testConnection(config) {
      const checks = [];

      try {
        await getAuthHeaders(context, config, true);
        checks.push({ name: "auth", ok: true, message: "认证可用" });
      } catch (error) {
        checks.push({ name: "auth", ok: false, message: error.message });
        return { ok: false, checks };
      }

      try {
        const listed = await this.list(config, { path: "/", page: 1, perPage: 20, refresh: false });
        checks.push({ name: "list", ok: true, message: "目录读取可用" });

        const firstFile = listed.content.find((item) => item && !item.is_dir && item.name);
        if (firstFile) {
          try {
            await this.get(config, { path: joinAlistPath(listed.path, firstFile.name) });
            checks.push({ name: "get", ok: true, message: "文件信息 API 可用" });
          } catch (error) {
            checks.push({ name: "get", ok: false, message: error.message });
          }
        } else {
          checks.push({ name: "get", ok: true, message: "根目录未发现文件，文件信息 API 已跳过" });
        }
      } catch (error) {
        checks.push({ name: "list", ok: false, message: error.message });
      }

      return {
        ok: checks.every((check) => check.ok),
        checks,
      };
    },
  };
};
