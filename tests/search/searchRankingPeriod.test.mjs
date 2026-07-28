import assert from "node:assert/strict";
import test from "node:test";

import {
  getSearchRankingDateRange,
  mergeDailyRankingWithLastSearch,
  normalizeSearchRankingPeriod,
} from "../../server/services/search/searchRankingPeriod.mjs";

test("search ranking periods use current calendar boundaries", () => {
  const now = new Date(2026, 6, 23, 15, 30, 0);

  const day = getSearchRankingDateRange("day", now);
  assert.equal(day.start.getHours(), 0);
  assert.equal(day.start.getDate(), 23);
  assert.equal(day.end.getDate(), 24);

  const week = getSearchRankingDateRange("week", now);
  assert.equal(week.start.getDay(), 0);
  assert.equal(week.start.getHours(), 0);

  const month = getSearchRankingDateRange("month", now);
  assert.equal(month.start.getDate(), 1);
  assert.equal(month.start.getMonth(), 6);
  assert.equal(month.end.getMonth(), 7);
  assert.equal(normalizeSearchRankingPeriod("invalid"), "all");
});

test("period rankings return daily aggregate counts instead of all-time counts", () => {
  const lastSearchAt = new Date("2026-07-23T02:00:00.000Z");
  const result = mergeDailyRankingWithLastSearch({
    dailyRows: [
      {
        keyword: "电影",
        _sum: {
          count: 3,
        },
      },
    ],
    searchRecords: [
      {
        keyword: "电影",
        count: 10000,
        lastSearchAt,
      },
    ],
  });

  assert.deepEqual(result, [
    {
      keyword: "电影",
      count: 3,
      lastSearchAt,
    },
  ]);
});
