import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_MODERATION_LIBRARY_SUMMARY,
  MODERATION_ACTIONS,
  MODERATION_CONTEXTS,
  evaluateContentModeration,
  maskModeratedText,
} from "../../server/services/moderation/policy.mjs";

test("netdisk search allows ambiguous resource terms without recording them", () => {
  for (const text of ["BT下载速度测试", "代理电影合集", "兼职纪录片", "在线播放资源"]) {
    const decision = evaluateContentModeration(text, {
      context: MODERATION_CONTEXTS.netdiskSearch,
    });

    assert.equal(decision.action, MODERATION_ACTIONS.allow);
    assert.equal(decision.allowed, true);
    assert.equal(decision.shouldRecord, false);
    assert.equal(decision.matches.some((match) => match.risk === "high"), false);
  }
});

test("netdisk search blocks high confidence gambling, porn, and fraud phrases", () => {
  for (const text of ["六合彩投注技巧", "裸聊色情资源", "代开发票教程"]) {
    const decision = evaluateContentModeration(text, {
      context: MODERATION_CONTEXTS.netdiskSearch,
    });

    assert.equal(decision.action, MODERATION_ACTIONS.block);
    assert.equal(decision.allowed, false);
    assert.equal(decision.shouldRecord, false);
    assert.equal(decision.risk, "high");
  }
});

test("forum content sends medium risk terms to review and blocks high risk terms", () => {
  const mediumDecision = evaluateContentModeration("招募兼职代理合作", {
    context: MODERATION_CONTEXTS.forumTopic,
  });

  assert.equal(mediumDecision.action, MODERATION_ACTIONS.review);
  assert.equal(mediumDecision.allowed, true);
  assert.equal(mediumDecision.needsReview, true);

  const highDecision = evaluateContentModeration("博彩代理推广", {
    context: MODERATION_CONTEXTS.forumTopic,
  });

  assert.equal(highDecision.action, MODERATION_ACTIONS.block);
  assert.equal(highDecision.allowed, false);
  assert.equal(highDecision.needsReview, false);
});

test("maskModeratedText masks only matched ranges", () => {
  const text = "  这是低价出售广告";
  const decision = evaluateContentModeration(text, {
    context: MODERATION_CONTEXTS.blogComment,
  });

  assert.equal(maskModeratedText(text, decision.matches), "  这是****广告");
});

test("custom allow and block lists override default rules", () => {
  const allowed = evaluateContentModeration("六合彩纪录片", {
    context: MODERATION_CONTEXTS.netdiskSearch,
    config: {
      customAllowedWords: ["六合彩"],
    },
  });
  assert.equal(allowed.action, MODERATION_ACTIONS.allow);

  const blocked = evaluateContentModeration("普通纪录片", {
    context: MODERATION_CONTEXTS.netdiskSearch,
    config: {
      customBlockedWords: ["普通纪录片"],
    },
  });
  assert.equal(blocked.action, MODERATION_ACTIONS.block);
});

test("custom rule library supports risk-level moderation", () => {
  const searchDecision = evaluateContentModeration("冷门资源站合集", {
    context: MODERATION_CONTEXTS.netdiskSearch,
    config: {
      customRules: [
        {
          word: "冷门资源站",
          category: "spam_or_contextual",
          risk: "medium",
          enabled: true,
        },
      ],
    },
  });

  assert.equal(searchDecision.action, MODERATION_ACTIONS.allow);
  assert.equal(searchDecision.allowed, true);
  assert.equal(searchDecision.shouldRecord, false);
  assert.equal(searchDecision.matches[0].source, "custom_library");

  const forumDecision = evaluateContentModeration("冷门资源站合集", {
    context: MODERATION_CONTEXTS.forumTopic,
    config: {
      customRules: [
        {
          word: "冷门资源站",
          category: "spam_or_contextual",
          risk: "medium",
          enabled: true,
        },
      ],
    },
  });

  assert.equal(forumDecision.action, MODERATION_ACTIONS.review);
  assert.equal(forumDecision.needsReview, true);

  const disabledDecision = evaluateContentModeration("冷门资源站合集", {
    context: MODERATION_CONTEXTS.forumTopic,
    config: {
      customRules: [
        {
          word: "冷门资源站",
          category: "spam_or_contextual",
          risk: "medium",
          enabled: false,
        },
      ],
    },
  });

  assert.equal(disabledDecision.action, MODERATION_ACTIONS.allow);
  assert.equal(disabledDecision.matches.length, 0);
});

test("default moderation library includes expanded high-confidence baseline", () => {
  assert.ok(DEFAULT_MODERATION_LIBRARY_SUMMARY.total >= 2000);
  assert.ok(DEFAULT_MODERATION_LIBRARY_SUMMARY.categories.gambling >= 500);
  assert.ok(DEFAULT_MODERATION_LIBRARY_SUMMARY.categories.fraud >= 500);
  assert.ok(DEFAULT_MODERATION_LIBRARY_SUMMARY.categories.illegal_finance >= 200);
  assert.ok(DEFAULT_MODERATION_LIBRARY_SUMMARY.categories.violence >= 200);
  assert.ok(DEFAULT_MODERATION_LIBRARY_SUMMARY.categories.political_person >= 100);

  for (const text of [
    "百家乐平台开户资料",
    "钓鱼链接源码合集",
    "地下钱庄渠道合集",
    "管制刀具交易资料",
  ]) {
    const decision = evaluateContentModeration(text, {
      context: MODERATION_CONTEXTS.netdiskSearch,
    });

    assert.equal(decision.action, MODERATION_ACTIONS.block);
    assert.equal(decision.allowed, false);
    assert.equal(decision.risk, "high");
    assert.equal(decision.matches[0].source, "default_expanded");
  }
});

test("political person names are enabled by the default baseline", () => {
  const decision = evaluateContentModeration("习近平纪录片合集", {
    context: MODERATION_CONTEXTS.netdiskSearch,
  });

  assert.equal(decision.action, MODERATION_ACTIONS.block);
  assert.equal(decision.allowed, false);
  assert.equal(decision.risk, "high");
  assert.equal(decision.categories[0], "political_person");
  assert.equal(decision.matches[0].source, "default_political_person");
});

test("broad political offices are not enabled by the person baseline", () => {
  for (const text of ["书记纪录片合集", "国务院资料合集", "中南海纪录片合集"]) {
    const decision = evaluateContentModeration(text, {
      context: MODERATION_CONTEXTS.netdiskSearch,
    });

    assert.equal(decision.action, MODERATION_ACTIONS.allow);
    assert.equal(decision.shouldRecord, true);
    assert.equal(decision.matches.length, 0);
  }
});
