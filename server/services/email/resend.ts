import prisma from "~/lib/prisma";
import { createError } from "h3";
import {
  decryptSettingValue,
  encryptSettingValue,
} from "~/server/utils/settings-crypto";

export const EMAIL_SERVICE_SETTING_KEY = "email_service_config";
export const EMAIL_SERVICE_SETTING_GROUP = "email";

const DEFAULT_EXPIRE_MINUTES = 60;

type StoredEmailServiceConfig = {
  enabled?: boolean;
  provider?: string;
  apiKeyEncrypted?: string;
  fromEmail?: string;
  fromName?: string;
  replyTo?: string;
  siteUrl?: string;
  verificationExpireMinutes?: number;
  requireVerificationForNewUsers?: boolean;
};

export type EmailServiceConfig = {
  enabled: boolean;
  provider: "resend";
  apiKey: string;
  fromEmail: string;
  fromName: string;
  replyTo: string;
  siteUrl: string;
  verificationExpireMinutes: number;
  requireVerificationForNewUsers: boolean;
};

const getDefaultEmailServiceConfig = (): EmailServiceConfig => ({
  enabled: false,
  provider: "resend",
  apiKey: "",
  fromEmail: "",
  fromName: "爱盼迷",
  replyTo: "",
  siteUrl: "",
  verificationExpireMinutes: DEFAULT_EXPIRE_MINUTES,
  requireVerificationForNewUsers: true,
});

const normalizeSiteUrl = (siteUrl?: string) => {
  return (siteUrl || "").trim().replace(/\/+$/, "");
};

const maskApiKey = (apiKey?: string) => {
  if (!apiKey) {
    return "";
  }

  if (apiKey.length <= 8) {
    return `${apiKey.slice(0, 2)}****`;
  }

  return `${apiKey.slice(0, 4)}****${apiKey.slice(-4)}`;
};

const isValidEmail = (value?: string) => {
  if (!value) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

const parseStoredConfig = (value?: string | null): StoredEmailServiceConfig => {
  if (!value) {
    return {};
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    console.error("解析邮箱配置失败:", error);
    return {};
  }
};

export const getEmailServiceConfig = async (): Promise<EmailServiceConfig> => {
  const settings = await prisma.systemSettings.findFirst({
    where: {
      key: EMAIL_SERVICE_SETTING_KEY,
      group: EMAIL_SERVICE_SETTING_GROUP,
    },
  });

  const stored = parseStoredConfig(settings?.value);
  const apiKey = decryptSettingValue(stored.apiKeyEncrypted);
  const defaults = getDefaultEmailServiceConfig();

  return {
    ...defaults,
    enabled: Boolean(stored.enabled),
    provider: "resend",
    apiKey,
    fromEmail: stored.fromEmail?.trim() || defaults.fromEmail,
    fromName: stored.fromName?.trim() || defaults.fromName,
    replyTo: stored.replyTo?.trim() || "",
    siteUrl: normalizeSiteUrl(stored.siteUrl),
    verificationExpireMinutes: Math.min(
      1440,
      Math.max(
        5,
        Number(stored.verificationExpireMinutes || defaults.verificationExpireMinutes),
      ),
    ),
    requireVerificationForNewUsers:
      stored.requireVerificationForNewUsers ?? defaults.requireVerificationForNewUsers,
  };
};

export const getEmailServiceConfigForAdmin = async () => {
  const config = await getEmailServiceConfig();

  return {
    enabled: config.enabled,
    provider: config.provider,
    hasApiKey: Boolean(config.apiKey),
    apiKeyMasked: maskApiKey(config.apiKey),
    fromEmail: config.fromEmail,
    fromName: config.fromName,
    replyTo: config.replyTo,
    siteUrl: config.siteUrl,
    verificationExpireMinutes: config.verificationExpireMinutes,
    requireVerificationForNewUsers: config.requireVerificationForNewUsers,
  };
};

export const saveEmailServiceConfig = async (input: {
  enabled?: boolean;
  provider?: string;
  apiKey?: string;
  fromEmail?: string;
  fromName?: string;
  replyTo?: string;
  siteUrl?: string;
  verificationExpireMinutes?: number;
  requireVerificationForNewUsers?: boolean;
}) => {
  const current = await getEmailServiceConfig();
  const nextApiKey = input.apiKey?.trim() || current.apiKey;
  const nextFromEmail = input.fromEmail?.trim() || "";
  const nextReplyTo = input.replyTo?.trim() || "";
  const nextSiteUrl = normalizeSiteUrl(input.siteUrl);
  const nextExpireMinutes = Math.min(
    1440,
    Math.max(
      5,
      Number(input.verificationExpireMinutes || current.verificationExpireMinutes),
    ),
  );
  const nextEnabled = Boolean(input.enabled);

  if ((input.provider || "resend") !== "resend") {
    throw createError({
      statusCode: 400,
      statusMessage: "当前只支持 Resend",
    });
  }

  if (nextFromEmail && !isValidEmail(nextFromEmail)) {
    throw createError({
      statusCode: 400,
      statusMessage: "发件邮箱格式不正确",
    });
  }

  if (nextReplyTo && !isValidEmail(nextReplyTo)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Reply-To 邮箱格式不正确",
    });
  }

  if (nextSiteUrl) {
    try {
      new URL(nextSiteUrl);
    } catch (error) {
      throw createError({
        statusCode: 400,
        statusMessage: "站点地址格式不正确",
      });
    }
  }

  if (nextEnabled) {
    if (!nextApiKey) {
      throw createError({
        statusCode: 400,
        statusMessage: "请填写 Resend API Key",
      });
    }

    if (!nextFromEmail) {
      throw createError({
        statusCode: 400,
        statusMessage: "请填写发件邮箱",
      });
    }

    if (!nextSiteUrl) {
      throw createError({
        statusCode: 400,
        statusMessage: "请填写站点地址",
      });
    }
  }

  const configToStore: StoredEmailServiceConfig = {
    enabled: nextEnabled,
    provider: "resend",
    apiKeyEncrypted: nextApiKey ? encryptSettingValue(nextApiKey) : "",
    fromEmail: nextFromEmail,
    fromName: input.fromName?.trim() || current.fromName,
    replyTo: nextReplyTo,
    siteUrl: nextSiteUrl,
    verificationExpireMinutes: nextExpireMinutes,
    requireVerificationForNewUsers:
      input.requireVerificationForNewUsers ?? current.requireVerificationForNewUsers,
  };

  await prisma.systemSettings.upsert({
    where: {
      key: EMAIL_SERVICE_SETTING_KEY,
    },
    update: {
      value: JSON.stringify(configToStore),
      group: EMAIL_SERVICE_SETTING_GROUP,
      description: "邮箱服务配置",
      isEnabled: nextEnabled,
    },
    create: {
      key: EMAIL_SERVICE_SETTING_KEY,
      value: JSON.stringify(configToStore),
      group: EMAIL_SERVICE_SETTING_GROUP,
      description: "邮箱服务配置",
      isEnabled: nextEnabled,
    },
  });
};

export const sendEmailMessage = async (
  input: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  },
  options?: {
    ignoreEnabled?: boolean;
  },
) => {
  const config = await getEmailServiceConfig();

  if (!options?.ignoreEnabled && !config.enabled) {
    throw createError({
      statusCode: 400,
      statusMessage: "邮箱服务未启用",
    });
  }

  if (!config.apiKey) {
    throw createError({
      statusCode: 400,
      statusMessage: "Resend API Key 未配置",
    });
  }

  if (!config.fromEmail) {
    throw createError({
      statusCode: 400,
      statusMessage: "发件邮箱未配置",
    });
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.fromName
        ? `${config.fromName} <${config.fromEmail}>`
        : config.fromEmail,
      to: [input.to],
      reply_to: config.replyTo || undefined,
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage =
      data?.message || data?.error || "Resend 邮件发送失败";

    throw createError({
      statusCode: response.status,
      statusMessage: errorMessage,
    });
  }

  return data;
};
