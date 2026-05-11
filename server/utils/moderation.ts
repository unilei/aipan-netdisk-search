import { createError } from "h3";
import prisma from "~/lib/prisma";
import {
  DEFAULT_MODERATION_LIBRARY_SUMMARY,
  evaluateContentModeration,
  MODERATION_ACTIONS,
  MODERATION_CONTEXTS,
  maskModeratedText,
  summarizeModerationDecision,
} from "~/server/services/moderation/policy.mjs";

export {
  DEFAULT_MODERATION_LIBRARY_SUMMARY,
  MODERATION_ACTIONS,
  MODERATION_CONTEXTS,
  maskModeratedText,
  summarizeModerationDecision,
};

export const MODERATION_SETTING_KEY = "content_moderation_config";
export const MODERATION_SETTING_GROUP = "moderation";

export interface ModerationConfig {
  enabled: boolean;
  customAllowedWords: string[];
  customBlockedWords: string[];
  customRules: ModerationCustomRule[];
}

export interface ModerationCustomRule {
  word: string;
  category: string;
  risk: "low" | "medium" | "high";
  enabled: boolean;
}

export const DEFAULT_MODERATION_CONFIG: ModerationConfig = {
  enabled: true,
  customAllowedWords: [],
  customBlockedWords: [],
  customRules: [],
};

const CONFIG_CACHE_TTL_MS = 30_000;
let cachedConfig: ModerationConfig | null = null;
let cachedConfigAt = 0;

const parseWordList = (value: unknown): string[] => {
  const rawItems = Array.isArray(value)
    ? value
    : String(value || "")
        .split(/\r?\n|,/)
        .map((item) => item.trim());

  return [...new Set(rawItems.map((item) => String(item || "").trim()).filter(Boolean))];
};

const normalizeCustomRuleRisk = (value: unknown): ModerationCustomRule["risk"] => {
  const risk = String(value || "").toLowerCase();
  return risk === "low" || risk === "high" ? risk : "medium";
};

const normalizeCustomRuleCategory = (value: unknown): string => {
  return (
    String(value || "custom")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "_") || "custom"
  );
};

const parseCustomRules = (value: unknown): ModerationCustomRule[] => {
  if (!Array.isArray(value)) return [];

  const rulesByKey = new Map<string, ModerationCustomRule>();

  for (const item of value) {
    if (!item || typeof item !== "object") continue;

    const source = item as Record<string, unknown>;
    const word = String(source.word || "").trim();
    if (!word) continue;

    const rule: ModerationCustomRule = {
      word,
      category: normalizeCustomRuleCategory(source.category),
      risk: normalizeCustomRuleRisk(source.risk),
      enabled: source.enabled !== false,
    };
    rulesByKey.set(`${rule.word}:${rule.category}`, rule);
  }

  return [...rulesByKey.values()];
};

export const normalizeModerationConfig = (
  input: Partial<ModerationConfig> = {}
): ModerationConfig => ({
  enabled: input.enabled ?? DEFAULT_MODERATION_CONFIG.enabled,
  customAllowedWords: parseWordList(input.customAllowedWords),
  customBlockedWords: parseWordList(input.customBlockedWords),
  customRules: parseCustomRules(input.customRules),
});

const parseStoredConfig = (value?: string | null): Partial<ModerationConfig> => {
  if (!value) return {};

  try {
    return JSON.parse(value);
  } catch (error) {
    console.error("内容审核配置解析失败，使用默认配置:", error);
    return {};
  }
};

export const getModerationConfig = async (): Promise<ModerationConfig> => {
  if (cachedConfig && Date.now() - cachedConfigAt < CONFIG_CACHE_TTL_MS) {
    return cachedConfig;
  }

  const settings = await prisma.systemSettings.findUnique({
    where: { key: MODERATION_SETTING_KEY },
  });

  if (!settings) {
    cachedConfig = DEFAULT_MODERATION_CONFIG;
    cachedConfigAt = Date.now();
    return cachedConfig;
  }

  cachedConfig = normalizeModerationConfig({
    ...parseStoredConfig(settings.value),
    enabled: settings.isEnabled ?? DEFAULT_MODERATION_CONFIG.enabled,
  });
  cachedConfigAt = Date.now();

  return cachedConfig;
};

export const saveModerationConfig = async (
  input: Partial<ModerationConfig>
): Promise<ModerationConfig> => {
  const config = normalizeModerationConfig(input);

  await prisma.systemSettings.upsert({
    where: { key: MODERATION_SETTING_KEY },
    update: {
      value: JSON.stringify(config),
      group: MODERATION_SETTING_GROUP,
      description: "内容审核与敏感词策略配置",
      isEnabled: config.enabled,
    },
    create: {
      key: MODERATION_SETTING_KEY,
      value: JSON.stringify(config),
      group: MODERATION_SETTING_GROUP,
      description: "内容审核与敏感词策略配置",
      isEnabled: config.enabled,
    },
  });

  cachedConfig = config;
  cachedConfigAt = Date.now();

  return config;
};

export const evaluateModerationWithConfig = async (
  text: string,
  options: { context?: string } = {}
) => {
  const config = await getModerationConfig();
  return evaluateContentModeration(text, {
    context: options.context || MODERATION_CONTEXTS.netdiskSearch,
    config,
  });
};

export const assertModerationAllowed = async (
  text: string,
  options: { context?: string } = {}
) => {
  const decision = await evaluateModerationWithConfig(text, options);

  if (!decision.allowed) {
    throw createError({
      statusCode: 400,
      statusMessage: "Content Moderation Blocked",
      message: decision.message || "内容包含敏感信息，请修改后重试",
      data: summarizeModerationDecision(decision),
    });
  }

  return decision;
};
