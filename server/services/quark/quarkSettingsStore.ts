import prisma from "~/lib/prisma";
import { normalizeQuarkConfig } from "~/server/services/quark/quarkConfig.mjs";

export const QUARK_CONFIG_SETTING_KEY = "quark_config";
export const QUARK_CONFIG_SETTING_GROUP = "quark";
export const QUARK_CONFIG_SETTING_DESCRIPTION = "夸克网盘转存配置";

export const getStoredQuarkConfig = async () => {
  const settings = await prisma.systemSettings.findUnique({
    where: {
      key: QUARK_CONFIG_SETTING_KEY,
    },
  });

  if (!settings) {
    return normalizeQuarkConfig({});
  }

  try {
    return normalizeQuarkConfig(JSON.parse(settings.value));
  } catch (error) {
    console.error("解析夸克配置失败:", error);
    return normalizeQuarkConfig({});
  }
};

export const saveQuarkConfig = async (config: Record<string, unknown>) => {
  const normalizedConfig = normalizeQuarkConfig(config);

  await prisma.systemSettings.upsert({
    where: {
      key: QUARK_CONFIG_SETTING_KEY,
    },
    update: {
      value: JSON.stringify(normalizedConfig),
      group: QUARK_CONFIG_SETTING_GROUP,
      description: QUARK_CONFIG_SETTING_DESCRIPTION,
    },
    create: {
      key: QUARK_CONFIG_SETTING_KEY,
      value: JSON.stringify(normalizedConfig),
      group: QUARK_CONFIG_SETTING_GROUP,
      description: QUARK_CONFIG_SETTING_DESCRIPTION,
    },
  });

  return normalizedConfig;
};
