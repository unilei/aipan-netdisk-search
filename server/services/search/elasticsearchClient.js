import { useRuntimeConfig } from "#imports";
import { Client } from "@elastic/elasticsearch";
import {
  deleteUserResourceDocument,
  reindexUserResourceDocuments,
  searchUserResourceDocuments,
  upsertUserResourceDocument,
} from "./userResourceSearchIndex.js";

let cachedClient = null;
let cachedConfigKey = null;

const buildConfigKey = (config) =>
  [
    config.node,
    config.username,
    config.password,
    config.caFingerprint,
    config.indexName,
  ].join("|");

export function getUserResourceSearchConfig(runtimeConfig = useRuntimeConfig()) {
  return {
    node: runtimeConfig.elasticsearchNode || process.env.ELASTICSEARCH_NODE || "",
    username:
      runtimeConfig.elasticsearchUsername ||
      process.env.ELASTICSEARCH_USERNAME ||
      "",
    password:
      runtimeConfig.elasticsearchPassword ||
      process.env.ELASTICSEARCH_PASSWORD ||
      "",
    caFingerprint:
      runtimeConfig.elasticsearchCaFingerprint ||
      process.env.ELASTICSEARCH_CA_FINGERPRINT ||
      "",
    indexName:
      runtimeConfig.elasticsearchUserResourceIndex ||
      process.env.ELASTICSEARCH_USER_RESOURCE_INDEX ||
      "",
  };
}

export function isUserResourceSearchConfigured(config = getUserResourceSearchConfig()) {
  return Boolean(
    config.node &&
      config.username &&
      config.password &&
      config.caFingerprint &&
      config.indexName
  );
}

function createSearchClient(config) {
  return new Client({
    node: config.node,
    auth: {
      username: config.username,
      password: config.password,
    },
    caFingerprint: config.caFingerprint,
    tls: {
      rejectUnauthorized: false,
    },
  });
}

export function getOptionalUserResourceSearchClient() {
  const config = getUserResourceSearchConfig();
  if (!isUserResourceSearchConfigured(config)) {
    return null;
  }

  const configKey = buildConfigKey(config);
  if (!cachedClient || cachedConfigKey !== configKey) {
    cachedClient = createSearchClient(config);
    cachedConfigKey = configKey;
  }

  return cachedClient;
}

export function getRequiredUserResourceSearchClient() {
  const client = getOptionalUserResourceSearchClient();
  if (!client) {
    throw new Error(
      "Elasticsearch is not fully configured. Please set ELASTICSEARCH_NODE, ELASTICSEARCH_USERNAME, ELASTICSEARCH_PASSWORD, ELASTICSEARCH_CA_FINGERPRINT, and ELASTICSEARCH_USER_RESOURCE_INDEX."
    );
  }

  return client;
}

export function getUserResourceSearchIndexName() {
  return getUserResourceSearchConfig().indexName;
}

export async function searchPublishedUserResources(keyword, size = 100) {
  const client = getOptionalUserResourceSearchClient();
  if (!client) {
    return [];
  }

  return searchUserResourceDocuments(
    client,
    getUserResourceSearchIndexName(),
    keyword,
    size
  );
}

export async function syncPublishedUserResource(resource) {
  return upsertUserResourceDocument(
    getRequiredUserResourceSearchClient(),
    getUserResourceSearchIndexName(),
    resource
  );
}

export async function removePublishedUserResource(resourceId) {
  return deleteUserResourceDocument(
    getRequiredUserResourceSearchClient(),
    getUserResourceSearchIndexName(),
    resourceId
  );
}

export async function reindexPublishedUserResources(resources, options = {}) {
  return reindexUserResourceDocuments(
    getRequiredUserResourceSearchClient(),
    getUserResourceSearchIndexName(),
    resources,
    options
  );
}
