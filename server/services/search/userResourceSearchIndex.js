import {
  normalizeLinks,
  normalizeSourceName,
} from "./source1Results.js";

export const USER_RESOURCE_INDEX_MAPPINGS = {
  dynamic: "strict",
  properties: {
    resourceId: { type: "integer" },
    name: { type: "text" },
    description: { type: "text" },
    typeId: { type: "integer" },
    typeName: { type: "text" },
    creatorId: { type: "integer" },
    creatorUsername: { type: "keyword" },
    links: { type: "object", enabled: false },
    createdAt: { type: "date" },
    updatedAt: { type: "date" },
  },
};

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

export function buildUserResourceDocumentId(resourceId) {
  return `user-resource-${resourceId}`;
}

export function buildUserResourceIndexDocument(resource) {
  return {
    resourceId: resource.id,
    name: normalizeSourceName(resource.name),
    description: resource.description || "",
    typeId: resource.typeId,
    typeName: resource.type?.name || "",
    creatorId: resource.creatorId,
    creatorUsername: resource.creator?.username || "",
    links: normalizeLinks(resource.links),
    createdAt: new Date(resource.createdAt).toISOString(),
    updatedAt: new Date(resource.updatedAt).toISOString(),
  };
}

export function buildUserResourceSearchQuery(keyword, size = 100) {
  return {
    size,
    sort: [{ _score: "desc" }, { updatedAt: "desc" }],
    query: {
      multi_match: {
        query: keyword,
        fields: ["name^5", "description^2", "typeName^2"],
      },
    },
  };
}

export function buildUserResourceAdminListQuery(options = {}) {
  const page = Math.max(Number.parseInt(options.page, 10) || 1, 1);
  const pageSize = Math.min(
    Math.max(Number.parseInt(options.pageSize, 10) || 20, 1),
    100
  );
  const search = String(options.search || "").trim();

  return {
    from: (page - 1) * pageSize,
    size: pageSize,
    track_total_hits: true,
    sort: search
      ? [{ _score: "desc" }, { updatedAt: "desc" }]
      : [{ updatedAt: "desc" }],
    query: search
      ? {
          multi_match: {
            query: search,
            fields: ["name^5", "description^2", "typeName^2"],
          },
        }
      : {
          match_all: {},
        },
  };
}

export async function ensureUserResourceIndex(client, indexName) {
  if (await indexExists(client, indexName)) {
    return false;
  }

  await client.indices.create({
    index: indexName,
    mappings: USER_RESOURCE_INDEX_MAPPINGS,
  });

  return true;
}

export async function upsertUserResourceDocument(client, indexName, resource) {
  await ensureUserResourceIndex(client, indexName);

  const document = buildUserResourceIndexDocument(resource);

  await client.index({
    index: indexName,
    id: buildUserResourceDocumentId(resource.id),
    document,
    refresh: "wait_for",
  });

  return document;
}

export async function deleteUserResourceDocument(client, indexName, resourceId) {
  if (!(await indexExists(client, indexName))) {
    return false;
  }

  try {
    await client.delete({
      index: indexName,
      id: buildUserResourceDocumentId(resourceId),
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

export async function searchUserResourceDocuments(
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
    ...buildUserResourceSearchQuery(keyword, size),
  });

  return getHits(response)
    .map((hit) => hit?._source)
    .filter(Boolean);
}

export async function listUserResourceDocuments(
  client,
  indexName,
  options = {}
) {
  if (!(await indexExists(client, indexName))) {
    return {
      documents: [],
      total: 0,
    };
  }

  const response = await client.search({
    index: indexName,
    ...buildUserResourceAdminListQuery(options),
  });

  return {
    documents: getHits(response)
      .map((hit) => ({
        documentId: hit?._id,
        score: hit?._score ?? null,
        document: hit?._source,
      }))
      .filter((item) => item.document),
    total: getTotalValue(response),
  };
}

export async function reindexUserResourceDocuments(
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

  await ensureUserResourceIndex(client, indexName);

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
        _id: buildUserResourceDocumentId(resource.id),
      },
    },
    buildUserResourceIndexDocument(resource),
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
