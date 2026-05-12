import prisma from "~/lib/prisma";
import { createError } from "h3";
import {
  decryptSettingValue,
  encryptSettingValue,
} from "~/server/utils/settings-crypto";
import {
  ALIST_AUTH_MODES,
  normalizeAlistAuthMode,
  normalizeAlistBaseUrl,
  normalizeAlistPath,
  toPublicAlistSource,
} from "./client.mjs";

const ALIST_SOURCE_SELECT = {
  id: true,
  name: true,
  link: true,
  authMode: true,
  username: true,
  secretEncrypted: true,
  rootPath: true,
  enabled: true,
  healthStatus: true,
  healthMessage: true,
  lastCheckedAt: true,
  createdAt: true,
  updatedAt: true,
  creatorId: true,
  creator: {
    select: { username: true },
  },
};

const getSecretFromInput = (input: Record<string, unknown>) =>
  String(input.secret || input.password || input.token || "").trim();

const normalizeSourceName = (value: unknown) => {
  const name = String(value || "").trim();
  if (name.length < 2 || name.length > 50) {
    throw createError({
      statusCode: 400,
      statusMessage: "AList 名称长度需要在 2 到 50 个字符之间",
    });
  }
  return name;
};

const normalizeRootPath = (value: unknown) => normalizeAlistPath(String(value || "/"), "/");

export const getAlistSourceSelect = () => ALIST_SOURCE_SELECT;

export const toAdminAlistSource = (source: any) => ({
  ...toPublicAlistSource(source),
  username: source.username || "",
  createdAt: source.createdAt,
  updatedAt: source.updatedAt,
  creator: source.creator,
});

export const toAlistClientConfig = (source: any) => ({
  id: source.id,
  name: source.name,
  link: source.link,
  authMode: normalizeAlistAuthMode(source.authMode),
  username: source.username || "",
  secret: decryptSettingValue(source.secretEncrypted),
  rootPath: source.rootPath || "/",
  enabled: source.enabled !== false,
});

export const normalizeAlistSourceInput = (
  input: Record<string, unknown>,
  current?: { authMode?: string | null; secretEncrypted?: string | null; username?: string | null },
) => {
  const authMode = normalizeAlistAuthMode(input.authMode);
  const nextSecret = getSecretFromInput(input);
  const currentSecret = normalizeAlistAuthMode(current?.authMode) === authMode
    ? decryptSettingValue(current?.secretEncrypted)
    : "";
  const secret = nextSecret || currentSecret;
  const username = String(input.username || current?.username || "").trim();

  if (authMode === ALIST_AUTH_MODES.password && !username) {
    throw createError({
      statusCode: 400,
      statusMessage: "账号密码模式需要填写用户名",
    });
  }

  if (authMode !== ALIST_AUTH_MODES.public && !secret) {
    throw createError({
      statusCode: 400,
      statusMessage: authMode === ALIST_AUTH_MODES.token
        ? "Token 模式需要填写 token"
        : "账号密码模式需要填写密码",
    });
  }

  return {
    name: normalizeSourceName(input.name),
    link: normalizeAlistBaseUrl(input.link),
    authMode,
    username: authMode === ALIST_AUTH_MODES.password ? username : null,
    secretEncrypted:
      authMode === ALIST_AUTH_MODES.public
        ? null
        : encryptSettingValue(secret),
    rootPath: normalizeRootPath(input.rootPath),
    enabled: input.enabled !== false,
  };
};

export const findAlistSourceById = async (id: number, options?: { enabledOnly?: boolean }) => {
  if (!Number.isFinite(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "AList sourceId 不正确",
    });
  }

  const source = await prisma.alist.findFirst({
    where: {
      id,
      ...(options?.enabledOnly ? { enabled: true } : {}),
    },
    select: ALIST_SOURCE_SELECT,
  });

  if (!source) {
    throw createError({
      statusCode: 404,
      statusMessage: "AList 源不存在或未启用",
    });
  }

  return source;
};

export const saveAlistHealth = async (
  id: number,
  health: { ok: boolean; message: string },
) => {
  await prisma.alist.update({
    where: { id },
    data: {
      healthStatus: health.ok ? "ok" : "error",
      healthMessage: health.message,
      lastCheckedAt: new Date(),
    },
  });
};
