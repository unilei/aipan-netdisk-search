import prisma from "~/lib/prisma";
import { fetchTvboxSources } from "./sources.mjs";

const TVBOX_SYNC_LOCK_KEY = 52610001;

const SOURCE_TYPE_ORDER_SQL = `
  CASE source_type
    WHEN 'single' THEN 1
    WHEN 'warehouse' THEN 2
    WHEN 'package' THEN 3
    WHEN 'discovery' THEN 4
    ELSE 9
  END
`;

const normalizeDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const normalizeCount = (value) => Number(value || 0);

const toTvboxSource = (row) => ({
  id: row.id,
  name: row.name,
  link: row.link,
  sourceType: row.sourceType,
  sourceTypeLabel: row.sourceTypeLabel,
  upstream: row.upstream || "",
  active: Boolean(row.active),
  firstSeenAt: normalizeDate(row.firstSeenAt),
  lastSeenAt: normalizeDate(row.lastSeenAt),
  lastSyncedAt: normalizeDate(row.lastSyncedAt),
});

const normalizeFetchedSource = (source) => ({
  name: String(source.name || "未命名数据源").trim() || "未命名数据源",
  link: String(source.link || "").trim(),
  sourceType: String(source.sourceType || "other").trim() || "other",
  sourceTypeLabel: String(source.sourceTypeLabel || "其他").trim() || "其他",
  upstream: source.upstream ? String(source.upstream).trim() : null,
});

const selectTvboxSourcesSql = `
  SELECT
    id,
    name,
    link,
    source_type AS "sourceType",
    source_type_label AS "sourceTypeLabel",
    upstream,
    active,
    first_seen_at AS "firstSeenAt",
    last_seen_at AS "lastSeenAt",
    last_synced_at AS "lastSyncedAt"
  FROM tvbox_sources
`;

export const listTvboxSourcesFromDatabase = async (
  prismaClient = prisma,
  options = {},
) => {
  const includeInactive = options.includeInactive === true;
  const rows = await prismaClient.$queryRawUnsafe(
    `${selectTvboxSourcesSql}
     ${includeInactive ? "" : "WHERE active = true"}
     ORDER BY ${SOURCE_TYPE_ORDER_SQL}, name ASC, id ASC`,
  );

  return rows.map(toTvboxSource);
};

export const getTvboxSourceSummary = async (prismaClient = prisma) => {
  const [summary] = await prismaClient.$queryRawUnsafe(`
    SELECT
      COUNT(*)::int AS "total",
      COUNT(*) FILTER (WHERE active = true)::int AS "activeTotal",
      MAX(last_synced_at) AS "lastSyncedAt"
    FROM tvbox_sources
  `);
  const groups = await prismaClient.$queryRawUnsafe(`
    SELECT
      source_type AS "sourceType",
      source_type_label AS "sourceTypeLabel",
      COUNT(*)::int AS "count"
    FROM tvbox_sources
    WHERE active = true
    GROUP BY source_type, source_type_label
    ORDER BY ${SOURCE_TYPE_ORDER_SQL}, source_type_label ASC
  `);

  return {
    total: normalizeCount(summary?.total),
    activeTotal: normalizeCount(summary?.activeTotal),
    lastSyncedAt: normalizeDate(summary?.lastSyncedAt),
    groups: groups.map((group) => ({
      sourceType: group.sourceType,
      sourceTypeLabel: group.sourceTypeLabel,
      count: normalizeCount(group.count),
    })),
  };
};

const upsertTvboxSource = (tx, source, syncedAt) => {
  const normalized = normalizeFetchedSource(source);
  if (!normalized.link) return Promise.resolve(0);

  return tx.$executeRawUnsafe(
    `
      INSERT INTO tvbox_sources (
        name,
        link,
        source_type,
        source_type_label,
        upstream,
        active,
        first_seen_at,
        last_seen_at,
        last_synced_at,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, true, $6, $6, $6, $6, $6)
      ON CONFLICT (link) DO UPDATE SET
        name = EXCLUDED.name,
        source_type = EXCLUDED.source_type,
        source_type_label = EXCLUDED.source_type_label,
        upstream = EXCLUDED.upstream,
        active = true,
        last_seen_at = EXCLUDED.last_seen_at,
        last_synced_at = EXCLUDED.last_synced_at,
        updated_at = EXCLUDED.updated_at
    `,
    normalized.name,
    normalized.link,
    normalized.sourceType,
    normalized.sourceTypeLabel,
    normalized.upstream,
    syncedAt,
  );
};

const deactivateMissingSources = async (tx, links) => {
  if (!links.length) {
    return tx.$executeRawUnsafe(`
      UPDATE tvbox_sources
      SET active = false, updated_at = CURRENT_TIMESTAMP
      WHERE active = true
    `);
  }

  const placeholders = links.map((_, index) => `$${index + 1}`).join(", ");
  return tx.$executeRawUnsafe(
    `
      UPDATE tvbox_sources
      SET active = false, updated_at = CURRENT_TIMESTAMP
      WHERE active = true AND link NOT IN (${placeholders})
    `,
    ...links,
  );
};

export const persistTvboxSources = async (
  fetchedSources,
  options = {},
) => {
  const prismaClient = options.prismaClient || prisma;
  const syncedAt = options.syncedAt || new Date();
  const sources = Array.isArray(fetchedSources) ? fetchedSources : [];
  const links = [...new Set(sources.map((item) => String(item.link || "").trim()).filter(Boolean))];

  return prismaClient.$transaction(async (tx) => {
    const [lockResult] = await tx.$queryRawUnsafe(
      `SELECT pg_try_advisory_xact_lock($1)::boolean AS "locked"`,
      TVBOX_SYNC_LOCK_KEY,
    );

    if (!lockResult?.locked) {
      return {
        skipped: true,
        reason: "locked",
        stored: 0,
        deactivated: 0,
        summary: await getTvboxSourceSummary(tx),
      };
    }

    let stored = 0;
    for (const source of sources) {
      stored += await upsertTvboxSource(tx, source, syncedAt);
    }

    const deactivated = await deactivateMissingSources(tx, links);
    const summary = await getTvboxSourceSummary(tx);

    return {
      skipped: false,
      stored,
      deactivated,
      summary,
    };
  });
};

export const syncTvboxSourcesToDatabase = async (options = {}) => {
  const fetcher = options.fetcher || globalThis.$fetch;
  const prismaClient = options.prismaClient || prisma;
  const fetched = await fetchTvboxSources(fetcher);
  const persistence = await persistTvboxSources(fetched.list, {
    prismaClient,
    syncedAt: new Date(),
  });

  return {
    list: fetched.list,
    meta: {
      ...fetched.meta,
      database: persistence,
    },
  };
};

export const getTvboxDatabasePayload = async (prismaClient = prisma) => {
  const [list, summary] = await Promise.all([
    listTvboxSourcesFromDatabase(prismaClient),
    getTvboxSourceSummary(prismaClient),
  ]);

  return {
    list,
    meta: {
      source: "database",
      total: list.length,
      database: summary,
    },
  };
};

export const shouldSyncTvboxSources = (summary, now = new Date()) => {
  if (!summary || !summary.activeTotal || !summary.lastSyncedAt) {
    return true;
  }

  const lastSyncedAt = new Date(summary.lastSyncedAt);
  if (Number.isNaN(lastSyncedAt.getTime())) {
    return true;
  }

  return now.getTime() - lastSyncedAt.getTime() >= 24 * 60 * 60 * 1000;
};
