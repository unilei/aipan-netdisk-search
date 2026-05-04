import {
  normalizeLinks,
  normalizeSourceName,
} from "./source1Results.js";

export const RESOURCE_INDEX_MAPPINGS = {
  dynamic: "strict",
  properties: {
    resourceId: { type: "integer" },
    name: { type: "text", analyzer: "ik_max_word", search_analyzer: "ik_smart" },
    typeId: { type: "integer" },
    typeName: { type: "text", analyzer: "ik_max_word", search_analyzer: "ik_smart" },
    creatorId: { type: "integer" },
    creatorUsername: { type: "keyword" },
    links: { type: "object", enabled: false },
    createdAt: { type: "date" },
    updatedAt: { type: "date" },
  },
};

const RESOURCE_SEARCH_FIELDS = ["name^5", "typeName^2"];

const getCountValue = (response) =>
  response?.count ?? response?.body?.count ?? 0;

const getTotalValue = (response) => {
  const total = response?.hits?.total ?? response?.body?.hits?.total;
  if (typeof total === "number") {
    return total;
  }

  return total?.value ?? 0;
};

const getHits = (response) =>
  response?.hits?.hits ?? response?.body?.hits?.hits ?? [];

const indexExists = async (client, indexName) => {
  const existsResponse = await client.indices.exists({ index: indexName });
  if (typeof existsResponse === "boolean") {
    return existsResponse;
  }

  return Boolean(existsResponse?.body ?? existsResponse);
};

export function buildResourceDocumentId(resourceId) {
  return `resource-${resourceId}`;
}

export function buildResourceIndexDocument(resource) {
  return {
    resourceId: resource.id,
    name: normalizeSourceName(resource.name),
    typeId: resource.typeId,
    typeName: resource.type?.name || "",
    creatorId: resource.creatorId,
    creatorUsername: resource.creator?.username || "",
    links: normalizeLinks(resource.links),
    createdAt: new Date(resource.createdAt).toISOString(),
    updatedAt: new Date(resource.updatedAt).toISOString(),
  };
}

export function buildResourceSearchQuery(keyword, size = 100) {
  return {
    size,
    sort: [{ _score: "desc" }, { updatedAt: "desc" }],
    query: buildResourceStrictKeywordQuery(keyword),
    highlight: {
      fields: {
        name: {
          pre_tags: ["<mark>"],
          post_tags: ["</mark>"],
          fragment_size: 0,
          number_of_fragments: 0,
        },
      },
    },
  };
}

export function buildResourceStrictKeywordQuery(keyword) {
  return {
    bool: {
      should: [
        {
          multi_match: {
            query: keyword,
            fields: RESOURCE_SEARCH_FIELDS,
            type: "phrase",
            boost: 8,
          },
        },
        {
          multi_match: {
            query: keyword,
            fields: RESOURCE_SEARCH_FIELDS,
            operator: "and",
          },
        },
      ],
      minimum_should_match: 1,
    },
  };
}

export async function ensureResourceIndex(client, indexName) {
  if (await indexExists(client, indexName)) {
    return false;
  }

  await client.indices.create({
    index: indexName,
    mappings: RESOURCE_INDEX_MAPPINGS,
  });

  return true;
}

export async function upsertResourceDocument(client, indexName, resource) {
  await ensureResourceIndex(client, indexName);

  const document = buildResourceIndexDocument(resource);

  await client.index({
    index: indexName,
    id: buildResourceDocumentId(resource.id),
    document,
    refresh: "wait_for",
  });

  return document;
}

export async function deleteResourceDocument(client, indexName, resourceId) {
  if (!(await indexExists(client, indexName))) {
    return false;
  }

  try {
    await client.delete({
      index: indexName,
      id: buildResourceDocumentId(resourceId),
      refresh: "wait_for",
    });
    return true;
  } catch (error) {
    if (error?.meta?.statusCode === 404) {
      return false;
    }

    throw error;
  }
}

export async function searchResourceDocuments(
  client,
  indexName,
  keyword,
  size = 100
) {
  if (!(await indexExists(client, indexName))) {
    return [];
  }

  const response = await client.search({
    index: indexName,
    ...buildResourceSearchQuery(keyword, size),
  });

  return getHits(response)
    .map((hit) => {
      const doc = hit?._source;
      if (!doc) return null;
      const highlightedName = hit?.highlight?.name?.[0] || null;
      if (highlightedName) {
        doc.highlightedName = highlightedName;
      }
      return doc;
    })
    .filter(Boolean);
}

export async function reindexResourceDocuments(
  client,
  indexName,
  resources,
  options = {}
) {
  const reset = Boolean(options.reset);
  let deleted = 0;

  if (reset && (await indexExists(client, indexName))) {
    const countResponse = await client.count({ index: indexName });
    deleted = getCountValue(countResponse);
    await client.indices.delete({ index: indexName });
  }

  await ensureResourceIndex(client, indexName);

  if (!resources.length) {
    return {
      indexed: 0,
      deleted,
      failed: 0,
      total: 0,
    };
  }

  const operations = resources.flatMap((resource) => [
    {
      index: {
        _index: indexName,
        _id: buildResourceDocumentId(resource.id),
      },
    },
    buildResourceIndexDocument(resource),
  ]);

  const response = await client.bulk({
    refresh: "wait_for",
    operations,
  });

  const items = response?.items ?? response?.body?.items ?? [];
  const failed = items.filter((item) => item.index?.error).length;

  return {
    indexed: resources.length - failed,
    deleted,
    failed,
    total: resources.length,
  };
}
