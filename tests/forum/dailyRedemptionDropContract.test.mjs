import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("daily redemption drop API and UI files exist", () => {
  assert.equal(existsSync(new URL("../../server/api/admin/points/daily-redemption-drop.ts", import.meta.url)), true);
  assert.equal(existsSync(new URL("../../server/api/user/points/daily-redemption-drop/status.get.ts", import.meta.url)), true);
  assert.equal(existsSync(new URL("../../server/api/user/points/daily-redemption-drop/claim.post.ts", import.meta.url)), true);
  assert.equal(existsSync(new URL("../../components/user/DailyRedemptionDropCard.vue", import.meta.url)), true);
  assert.equal(existsSync(new URL("../../pages/admin/points/daily-redemption-drop.vue", import.meta.url)), true);
});

test("forum and points center route users toward the daily drop instead of posting for codes", () => {
  const forumIndex = read("../../pages/forum/index.vue");
  const pointsCenter = read("../../pages/user/checkin.vue");
  const adminLayout = read("../../layouts/admin.vue");

  assert.match(forumIndex, /每日福利/);
  assert.match(forumIndex, /每天固定时间发放积分/);
  assert.match(forumIndex, /去领取/);
  assert.doesNotMatch(forumIndex, /求兑换码/);
  assert.match(forumIndex, /daily-redemption-drop/);
  assert.match(pointsCenter, /UserDailyRedemptionDropCard/);
  assert.match(adminLayout, /每日抢兑/);
  assert.match(adminLayout, /\/admin\/points\/daily-redemption-drop/);
});
