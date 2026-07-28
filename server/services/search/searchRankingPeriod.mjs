export const SEARCH_RANKING_PERIODS = new Set([
  "all",
  "day",
  "week",
  "month",
]);

export const normalizeSearchRankingPeriod = (value) => {
  const normalized = String(value || "all").toLowerCase();
  return SEARCH_RANKING_PERIODS.has(normalized) ? normalized : "all";
};

export const getSearchRankingDateRange = (period, now = new Date()) => {
  const normalizedPeriod = normalizeSearchRankingPeriod(period);
  if (normalizedPeriod === "all") {
    return null;
  }

  const start = new Date(now);
  const end = new Date(now);

  if (normalizedPeriod === "day") {
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() + 1);
  } else if (normalizedPeriod === "week") {
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() + 1);
  } else {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(end.getMonth() + 1, 1);
    end.setHours(0, 0, 0, 0);
  }

  return {
    start,
    end,
  };
};

export const mergeDailyRankingWithLastSearch = ({
  dailyRows = [],
  searchRecords = [],
  fallbackDate = new Date(),
}) => {
  const recordsByKeyword = new Map(
    searchRecords.map((record) => [record.keyword, record]),
  );

  return dailyRows.map((row) => ({
    keyword: row.keyword,
    count: Number(row?._sum?.count || 0),
    lastSearchAt:
      recordsByKeyword.get(row.keyword)?.lastSearchAt || fallbackDate,
  }));
};
