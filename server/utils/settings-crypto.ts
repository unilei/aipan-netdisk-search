import crypto from "node:crypto";
import { useRuntimeConfig } from "#imports";
import { createError } from "h3";

const ENCRYPTION_PREFIX = "enc:v1:";

const getEncryptionKey = () => {
  const config = useRuntimeConfig();
  const secret = config.settingsEncryptionKey || config.jwtSecret;

  if (!secret) {
    throw createError({
      statusCode: 500,
      statusMessage: "SETTINGS_ENCRYPTION_KEY 未配置",
    });
  }

  return crypto.createHash("sha256").update(String(secret)).digest();
};

export const encryptSettingValue = (value: string) => {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return `${ENCRYPTION_PREFIX}${Buffer.concat([iv, tag, encrypted]).toString("base64")}`;
};

export const decryptSettingValue = (value?: string | null) => {
  if (!value) {
    return "";
  }

  if (!value.startsWith(ENCRYPTION_PREFIX)) {
    return value;
  }

  const payload = Buffer.from(value.slice(ENCRYPTION_PREFIX.length), "base64");
  const iv = payload.subarray(0, 12);
  const tag = payload.subarray(12, 28);
  const encrypted = payload.subarray(28);
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);

  decipher.setAuthTag(tag);

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString("utf8");
};
