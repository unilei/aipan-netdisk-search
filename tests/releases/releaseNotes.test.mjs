import assert from "node:assert/strict";
import test from "node:test";

import { releaseNotes } from "../../utils/releaseNotes.js";
import {
  getReleaseNotesFromSettings,
  getLatestReleaseIdentity,
  normalizeReleaseNotes,
} from "../../server/services/releases/releaseNotes.mjs";

test("releaseNotes are sorted newest first", () => {
  const dates = releaseNotes.map((note) => note.date);
  assert.deepEqual(dates, [...dates].sort().reverse());
});

test("releaseNotes include the user resource auto review release", () => {
  const latest = releaseNotes[0];

  assert.match(latest.title, /用户投稿/);
  assert.ok(
    latest.highlights.some((highlight) => highlight.includes("自动审核"))
  );
  assert.ok(latest.highlights.some((highlight) => highlight.includes("ES")));
});

test("normalizeReleaseNotes keeps only published notes and sorts by date", () => {
  const notes = normalizeReleaseNotes([
    {
      version: "2026.05.02",
      date: "2026-05-02",
      title: "草稿更新",
      summary: "不会出现在前台",
      status: "draft",
      highlights: ["仅后台可见"],
    },
    {
      version: "2026.05.01",
      date: "2026-05-01",
      title: "积分中心升级",
      summary: "用户可以更清楚地查看积分构成。",
      category: "用户中心",
      status: "published",
      highlights: "有效积分\n积分排行",
    },
    {
      version: "2026.05.03",
      date: "2026-05-03",
      title: "发布日志升级",
      summary: "用户可以看到最新更新。",
      category: "体验优化",
      status: "published",
      highlights: ["未读提醒", "后台维护"],
      isImportant: true,
    },
  ]);

  assert.deepEqual(
    notes.map((note) => note.version),
    ["2026.05.03", "2026.05.01"]
  );
  assert.equal(notes[0].isImportant, true);
  assert.deepEqual(notes[1].highlights, ["有效积分", "积分排行"]);
});

test("getLatestReleaseIdentity creates a stable client read marker", () => {
  assert.equal(
    getLatestReleaseIdentity({
      version: "2026.05.03",
      date: "2026-05-03",
      title: "发布日志升级",
    }),
    "2026.05.03:2026-05-03"
  );
});

test("getReleaseNotesFromSettings respects an intentionally empty setting", async () => {
  const prisma = {
    systemSettings: {
      findUnique: async () => ({ value: JSON.stringify({ notes: [] }) }),
    },
  };

  const result = await getReleaseNotesFromSettings(prisma);

  assert.equal(result.source, "settings");
  assert.deepEqual(result.notes, []);
});
