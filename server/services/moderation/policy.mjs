import { cultWords } from "../../../utils/keywords/cult.js";
import { fraudWords } from "../../../utils/keywords/fraud.js";
import { gamblingWords } from "../../../utils/keywords/gambling.js";
import { illegalFinanceWords } from "../../../utils/keywords/illegal_finance.js";
import { politicalPersonWords } from "../../../utils/keywords/political.js";
import { pornWords } from "../../../utils/keywords/porn.js";
import { pyramidSchemeWords } from "../../../utils/keywords/pyramid_scheme.js";
import { violenceWords } from "../../../utils/keywords/violence.js";

export const MODERATION_CONTEXTS = Object.freeze({
  netdiskSearch: "netdisk_search",
  aiSearch: "ai_search",
  blogPost: "blog_post",
  blogComment: "blog_comment",
  forumTopic: "forum_topic",
  forumReply: "forum_reply",
  userResource: "user_resource",
});

export const MODERATION_ACTIONS = Object.freeze({
  allow: "allow",
  mask: "mask",
  review: "review",
  block: "block",
});

const RISK_WEIGHT = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
};

const DEFAULT_CONFIG = Object.freeze({
  enabled: true,
  customAllowedWords: [],
  customBlockedWords: [],
  customRules: [],
});

const SEARCH_CONTEXTS = new Set([
  MODERATION_CONTEXTS.netdiskSearch,
  MODERATION_CONTEXTS.aiSearch,
]);

const FORUM_CONTEXTS = new Set([
  MODERATION_CONTEXTS.forumTopic,
  MODERATION_CONTEXTS.forumReply,
]);

const AMBIGUOUS_WORDS = new Set([
  "3p",
  "ly",
  "js",
  "bt",
  "sm",
  "av",
  "gv",
  "spa",
  "ktv",
  "mb",
  "代理",
  "兼职",
  "全职",
  "网购",
  "网络工作",
  "推广",
  "客服",
  "技术",
  "运营",
  "中介",
  "加盟",
  "连锁",
  "分销",
  "营销",
  "业务经理",
  "市场经理",
  "技术经理",
  "客服经理",
  "运营经理",
  "下载速度",
  "高清在线",
  "全集在线",
  "在线播放",
  "txt下载",
  "成人",
  "写真",
  "自拍",
  "按摩",
  "麻将",
  "扑克",
  "筹码",
  "骰子",
  "书记",
  "市长",
  "省长",
  "部长",
]);

const MEDIUM_RISK_WORDS = [
  "BT",
  "代理",
  "兼职",
  "全职",
  "网络工作",
  "推广",
  "加盟",
  "网购",
  "低价出售",
  "款到发货",
  "免费使用",
  "免费索取",
  "下载速度",
  "高清在线",
  "全集在线",
  "在线播放",
  "txt下载",
  "请点击进入",
  "详情请进入",
  "回复可见",
];

const MANUAL_HIGH_RISK_RULES = [
  { word: "六合彩", category: "gambling" },
  { word: "博彩代理", category: "gambling" },
  { word: "赌博代理", category: "gambling" },
  { word: "赌场代理", category: "gambling" },
  { word: "裸聊", category: "porn" },
  { word: "卖淫", category: "porn" },
  { word: "嫖娼", category: "porn" },
  { word: "招嫖", category: "porn" },
  { word: "援交", category: "porn" },
  { word: "代开发票", category: "fraud" },
  { word: "信用卡提现", category: "fraud" },
  { word: "私人侦探", category: "fraud" },
  { word: "私家侦探", category: "fraud" },
  { word: "无抵押贷款", category: "illegal_finance" },
  { word: "地下钱庄", category: "illegal_finance" },
  { word: "非法集资", category: "illegal_finance" },
  { word: "完全自杀手册", category: "violence" },
  { word: "用刀横向切腹", category: "violence" },
  { word: "传销", category: "pyramid_scheme" },
  { word: "拉人头", category: "pyramid_scheme" },
];

const HIGH_CONFIDENCE_PATTERNS = {
  gambling: /(赌博|博彩|赌场|赌球|赌马|投注|下注|六合彩|私彩|网赌|百家乐|时时彩|炸金花|盘口|赔率|庄家)/i,
  porn: /(色情|裸聊|裸照|果照|露点|卖淫|嫖娼|援交|招嫖|约炮|黄片|成人视频|成人电影|无码|口交|淫秽|里番|h漫)/i,
  fraud: /(诈骗|骗术|假证|代开发票|刷单|跑分|钓鱼网站|木马|黑产|针孔摄像|私人侦探|私家侦探)/i,
  illegal_finance: /(洗钱|地下钱庄|非法集资|高利贷|套路贷|信用卡提现|无抵押贷款|资金盘)/i,
  pyramid_scheme: /(传销|拉人头|资金盘|庞氏|多层分销|非法直销)/i,
  cult: /(邪教|法轮功|全能神|门徒会|呼喊派|观音法门)/i,
  violence: /(杀人教程|自杀手册|制毒|炸药|爆炸物|枪支弹药|砍杀教程|投毒)/i,
};

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFKC")
    .toLowerCase();

const normalizeWord = (value) => normalizeText(value).trim().replace(/\s+/g, " ");

const uniq = (items) => [...new Set(items.filter(Boolean))];

const normalizeRisk = (risk) => {
  const normalized = String(risk || "").toLowerCase();
  return RISK_WEIGHT[normalized] ? normalized : "medium";
};

const normalizeCategory = (category) =>
  normalizeWord(category || "custom").replace(/[^a-z0-9_-]/g, "_") || "custom";

const isAmbiguousWord = (word) => {
  const normalized = normalizeWord(word);
  return AMBIGUOUS_WORDS.has(normalized) || [...normalized].length <= 1;
};

const buildGeneratedRules = (words, category, pattern) =>
  uniq(words)
    .map((word) => normalizeWord(word))
    .filter((word) => word && !isAmbiguousWord(word) && pattern.test(word))
    .map((word) => ({
      word,
      category,
      risk: "high",
      source: "default",
    }));

const buildPhraseRules = ({
  category,
  terms,
  prefixes = [],
  suffixes = [],
  risk = "high",
}) =>
  uniq(terms)
    .flatMap((term) => {
      const normalizedTerm = normalizeWord(term);
      if (!normalizedTerm) return [];

      return [
        ...uniq(prefixes).map((prefix) => `${normalizeWord(prefix)}${normalizedTerm}`),
        ...uniq(suffixes).map((suffix) => `${normalizedTerm}${normalizeWord(suffix)}`),
      ];
    })
    .map((word) => normalizeWord(word))
    .filter((word) => word && !isAmbiguousWord(word))
    .map((word) => ({
      word,
      category,
      risk,
      source: "default_expanded",
    }));

const buildListRules = ({ words, category, risk = "high", source = "default" }) =>
  uniq(words)
    .map((word) => normalizeWord(word))
    .filter((word) => word && !isAmbiguousWord(word))
    .map((word) => ({
      word,
      category,
      risk,
      source,
    }));

const EXPANDED_HIGH_CONFIDENCE_RULES = [
  ...buildPhraseRules({
    category: "gambling",
    terms: [
      "博彩",
      "赌博",
      "赌场",
      "体育投注",
      "赌球",
      "六合彩",
      "时时彩",
      "百家乐",
      "北京赛车",
      "极速飞艇",
      "捕鱼机",
      "老虎机",
      "彩票投注",
      "私彩",
      "赌盘",
      "网赌",
      "德州扑克",
      "娱乐城",
    ],
    prefixes: ["代理", "加盟", "推广", "运营", "线上", "地下", "跨境"],
    suffixes: [
      "平台",
      "网站",
      "app",
      "链接",
      "代理",
      "开户",
      "充值",
      "提现",
      "返水",
      "回水",
      "盘口",
      "群",
      "源码",
      "脚本",
      "客服",
      "招商",
      "投注",
    ],
  }),
  ...buildPhraseRules({
    category: "porn",
    terms: [
      "裸聊",
      "招嫖",
      "援交",
      "卖淫",
      "嫖娼",
      "约炮",
      "成人直播",
      "色情直播",
      "成人影片",
      "成人视频",
      "无码",
      "里番",
      "黄播",
      "情色陪聊",
      "上门特殊服务",
    ],
    prefixes: ["付费", "同城", "上门", "私密", "非法"],
    suffixes: [
      "网站",
      "app",
      "链接",
      "群",
      "资源",
      "视频",
      "直播",
      "服务",
      "信息",
      "广告",
      "平台",
      "下载",
      "联系方式",
    ],
  }),
  ...buildPhraseRules({
    category: "fraud",
    terms: [
      "杀猪盘",
      "刷单返利",
      "跑分",
      "钓鱼网站",
      "钓鱼链接",
      "盗号木马",
      "木马病毒",
      "黑产",
      "接码平台",
      "猫池",
      "短信轰炸",
      "银行卡四件套",
      "实名资料",
      "身份证资料",
      "个人信息买卖",
      "代开发票",
      "假证",
    ],
    prefixes: ["出售", "购买", "批量", "低价", "非法", "灰产", "黑产"],
    suffixes: [
      "平台",
      "网站",
      "教程",
      "源码",
      "工具",
      "软件",
      "服务",
      "渠道",
      "广告",
      "代理",
      "群",
      "接口",
    ],
  }),
  ...buildPhraseRules({
    category: "illegal_finance",
    terms: [
      "洗钱",
      "地下钱庄",
      "地下换汇",
      "非法集资",
      "非法吸收公众存款",
      "高利贷",
      "套路贷",
      "砍头息",
      "裸贷",
      "非法配资",
      "场外配资",
      "虚拟币洗钱",
      "信用卡套现",
      "无抵押黑贷",
      "非法放贷",
    ],
    prefixes: ["办理", "代理", "提供", "快速", "地下", "非法"],
    suffixes: [
      "平台",
      "渠道",
      "服务",
      "中介",
      "教程",
      "广告",
      "app",
      "网站",
      "群",
      "代理",
    ],
  }),
  ...buildPhraseRules({
    category: "pyramid_scheme",
    terms: [
      "传销",
      "拉人头",
      "资金盘",
      "庞氏骗局",
      "多级分销",
      "团队计酬",
      "入门费",
      "发展下线",
      "静态收益",
      "动态收益",
    ],
    prefixes: ["招募", "推广", "包装", "洗脑", "高收益", "零风险"],
    suffixes: [
      "项目",
      "模式",
      "课程",
      "平台",
      "系统",
      "团队",
      "骗局",
      "培训",
      "话术",
      "招商",
    ],
  }),
  ...buildPhraseRules({
    category: "cult",
    terms: [
      "法轮功",
      "全能神",
      "东方闪电",
      "门徒会",
      "呼喊派",
      "观音法门",
      "大法弟子",
      "真善忍",
      "末日教派",
      "非法邪教",
    ],
    prefixes: ["宣传", "传播", "组织", "参与", "加入"],
    suffixes: ["资料", "经文", "视频", "聚会", "组织", "宣传", "群", "书籍", "教程"],
  }),
  ...buildPhraseRules({
    category: "violence",
    terms: [
      "枪支",
      "弹药",
      "炸药",
      "雷管",
      "爆炸物",
      "管制刀具",
      "弩箭",
      "制毒",
      "贩毒",
      "杀人教程",
      "自杀手册",
      "投毒",
      "爆炸教程",
    ],
    prefixes: ["购买", "出售", "制作", "自制", "非法", "地下", "批发"],
    suffixes: [
      "购买",
      "出售",
      "交易",
      "教程",
      "图纸",
      "配方",
      "渠道",
      "网站",
      "群",
      "工具",
      "材料",
    ],
  }),
];

const DEFAULT_RULES = [
  ...MANUAL_HIGH_RISK_RULES.map((rule) => ({
    ...rule,
    word: normalizeWord(rule.word),
    risk: "high",
    source: "default",
  })),
  ...buildGeneratedRules(
    gamblingWords,
    "gambling",
    HIGH_CONFIDENCE_PATTERNS.gambling
  ),
  ...buildGeneratedRules(pornWords, "porn", HIGH_CONFIDENCE_PATTERNS.porn),
  ...buildGeneratedRules(fraudWords, "fraud", HIGH_CONFIDENCE_PATTERNS.fraud),
  ...buildGeneratedRules(
    illegalFinanceWords,
    "illegal_finance",
    HIGH_CONFIDENCE_PATTERNS.illegal_finance
  ),
  ...buildGeneratedRules(
    pyramidSchemeWords,
    "pyramid_scheme",
    HIGH_CONFIDENCE_PATTERNS.pyramid_scheme
  ),
  ...buildGeneratedRules(cultWords, "cult", HIGH_CONFIDENCE_PATTERNS.cult),
  ...buildGeneratedRules(
    violenceWords,
    "violence",
    HIGH_CONFIDENCE_PATTERNS.violence
  ),
  ...buildListRules({
    words: politicalPersonWords,
    category: "political_person",
    source: "default_political_person",
  }),
  ...EXPANDED_HIGH_CONFIDENCE_RULES,
  ...MEDIUM_RISK_WORDS.map((word) => ({
    word: normalizeWord(word),
    category: "spam_or_contextual",
    risk: "medium",
    source: "default",
  })),
];

const normalizedRules = (() => {
  const rulesByKey = new Map();

  for (const rule of DEFAULT_RULES) {
    if (!rule.word) continue;
    const key = `${rule.word}:${rule.category}`;
    const existing = rulesByKey.get(key);
    if (!existing || RISK_WEIGHT[rule.risk] > RISK_WEIGHT[existing.risk]) {
      rulesByKey.set(key, rule);
    }
  }

  return [...rulesByKey.values()];
})();

export const DEFAULT_MODERATION_LIBRARY_SUMMARY = Object.freeze(
  normalizedRules.reduce(
    (summary, rule) => {
      summary.total += 1;
      summary.categories[rule.category] = (summary.categories[rule.category] || 0) + 1;
      summary.risks[rule.risk] = (summary.risks[rule.risk] || 0) + 1;
      return summary;
    },
    { total: 0, categories: {}, risks: {} }
  )
);

const findWordRanges = (normalizedText, word) => {
  const ranges = [];
  let fromIndex = 0;

  while (fromIndex < normalizedText.length) {
    const index = normalizedText.indexOf(word, fromIndex);
    if (index === -1) break;
    ranges.push({ start: index, end: index + word.length });
    fromIndex = index + Math.max(word.length, 1);
  }

  return ranges;
};

const rangesOverlap = (a, b) => a.start < b.end && b.start < a.end;

const isWithinAllowedRange = (range, allowedRanges) =>
  allowedRanges.some((allowedRange) => rangesOverlap(range, allowedRange));

const selectNonOverlappingMatches = (matches) => {
  const selected = [];
  const sorted = [...matches].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    if (RISK_WEIGHT[b.risk] !== RISK_WEIGHT[a.risk]) {
      return RISK_WEIGHT[b.risk] - RISK_WEIGHT[a.risk];
    }
    return b.word.length - a.word.length;
  });

  for (const match of sorted) {
    if (selected.some((selectedMatch) => rangesOverlap(match, selectedMatch))) {
      continue;
    }
    selected.push(match);
  }

  return selected.sort((a, b) => a.start - b.start);
};

const normalizeConfig = (config = {}) => ({
  ...DEFAULT_CONFIG,
  ...config,
  enabled: config.enabled ?? DEFAULT_CONFIG.enabled,
  customAllowedWords: Array.isArray(config.customAllowedWords)
    ? config.customAllowedWords
    : [],
  customBlockedWords: Array.isArray(config.customBlockedWords)
    ? config.customBlockedWords
    : [],
  customRules: Array.isArray(config.customRules)
    ? config.customRules
        .map((rule) => ({
          word: normalizeWord(rule?.word),
          category: normalizeCategory(rule?.category),
          risk: normalizeRisk(rule?.risk),
          enabled: rule?.enabled !== false,
        }))
        .filter((rule) => rule.word)
    : [],
});

const buildRuntimeRules = (config) => [
  ...normalizedRules,
  ...config.customRules
    .filter((rule) => rule.enabled !== false)
    .map((rule) => ({
      word: rule.word,
      category: rule.category,
      risk: rule.risk,
      source: "custom_library",
    })),
  ...uniq(config.customBlockedWords)
    .map((word) => normalizeWord(word))
    .filter(Boolean)
    .map((word) => ({
      word,
      category: "custom",
      risk: "high",
      source: "custom",
    })),
];

const resolveAction = ({ context, risk, hasMatches }) => {
  if (!hasMatches || risk === "none") {
    return MODERATION_ACTIONS.allow;
  }

  if (risk === "high") {
    return MODERATION_ACTIONS.block;
  }

  if (SEARCH_CONTEXTS.has(context)) {
    return MODERATION_ACTIONS.allow;
  }

  if (FORUM_CONTEXTS.has(context) || context === MODERATION_CONTEXTS.userResource) {
    return MODERATION_ACTIONS.review;
  }

  if (context === MODERATION_CONTEXTS.blogComment) {
    return MODERATION_ACTIONS.mask;
  }

  return MODERATION_ACTIONS.review;
};

const buildModerationMessage = ({ action, risk }) => {
  if (action === MODERATION_ACTIONS.block) {
    return risk === "high"
      ? "内容包含高风险敏感信息，请修改后重试"
      : "内容包含敏感信息，请修改后重试";
  }

  if (action === MODERATION_ACTIONS.review) {
    return "内容需要人工审核，通过后会正常展示";
  }

  if (action === MODERATION_ACTIONS.mask) {
    return "内容已自动处理后发布";
  }

  return "";
};

export function evaluateContentModeration(text, options = {}) {
  const config = normalizeConfig(options.config);
  const context = options.context || MODERATION_CONTEXTS.netdiskSearch;
  const originalText = String(text || "");
  const normalizedText = normalizeText(originalText);

  if (!config.enabled || !normalizedText.trim()) {
    return {
      action: MODERATION_ACTIONS.allow,
      allowed: true,
      needsReview: false,
      shouldRecord: Boolean(normalizedText.trim()),
      risk: "none",
      categories: [],
      matches: [],
      message: "",
    };
  }

  const allowedRanges = uniq(config.customAllowedWords)
    .map((word) => normalizeWord(word))
    .filter(Boolean)
    .flatMap((word) => findWordRanges(normalizedText, word));

  const rawMatches = [];
  for (const rule of buildRuntimeRules(config)) {
    for (const range of findWordRanges(normalizedText, rule.word)) {
      if (isWithinAllowedRange(range, allowedRanges)) {
        continue;
      }

      rawMatches.push({
        word: originalText.slice(range.start, range.end),
        normalizedWord: rule.word,
        category: rule.category,
        risk: rule.risk,
        source: rule.source,
        start: range.start,
        end: range.end,
      });
    }
  }

  const matches = selectNonOverlappingMatches(rawMatches);
  const risk = matches.reduce(
    (currentRisk, match) =>
      RISK_WEIGHT[match.risk] > RISK_WEIGHT[currentRisk]
        ? match.risk
        : currentRisk,
    "none"
  );
  const categories = uniq(matches.map((match) => match.category));
  const action = resolveAction({ context, risk, hasMatches: matches.length > 0 });
  const shouldRecord = action === MODERATION_ACTIONS.allow && matches.length === 0;

  return {
    action,
    allowed: action !== MODERATION_ACTIONS.block,
    needsReview: action === MODERATION_ACTIONS.review,
    shouldRecord,
    risk,
    categories,
    matches,
    message: buildModerationMessage({ action, risk }),
  };
}

export function maskModeratedText(text, matches = [], replaceChar = "*") {
  const chars = [...String(text || "")];

  for (const match of matches) {
    for (let index = match.start; index < match.end; index += 1) {
      if (chars[index]) {
        chars[index] = replaceChar;
      }
    }
  }

  return chars.join("");
}

export function summarizeModerationDecision(decision) {
  return {
    action: decision.action,
    allowed: decision.allowed,
    needsReview: decision.needsReview,
    shouldRecord: decision.shouldRecord,
    risk: decision.risk,
    categories: decision.categories,
    matches: decision.matches.map((match) => ({
      word: match.word,
      category: match.category,
      risk: match.risk,
      source: match.source,
    })),
    message: decision.message,
  };
}
