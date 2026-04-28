import { useRuntimeConfig } from "#imports";
import { Client } from "@elastic/elasticsearch";
import {
  deleteUserResourceDocument,
  listUserResourceDocuments,
  reindexUserResourceDocuments,
  searchUserResourceDocuments,
  upsertUserResourceDocument,
} from "./userResourceSearchIndex.js";
import {
  deleteResourceDocument,
  reindexResourceDocuments,
  searchResourceDocuments,
  upsertResourceDocument,
} from "./resourceSearchIndex.js";

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

export function getElasticsearchBaseConfig(runtimeConfig = useRuntimeConfig()) {
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
  };
}

export function getUserResourceSearchConfig(runtimeConfig = useRuntimeConfig()) {
  return {
    ...getElasticsearchBaseConfig(runtimeConfig),
    indexName:
      runtimeConfig.elasticsearchUserResourceIndex ||
      process.env.ELASTICSEARCH_USER_RESOURCE_INDEX ||
      "",
  };
}

export function getResourceSearchConfig(runtimeConfig = useRuntimeConfig()) {
  return {
    ...getElasticsearchBaseConfig(runtimeConfig),
    indexName:
      runtimeConfig.elasticsearchResourceIndex ||
      process.env.ELASTICSEARCH_RESOURCE_INDEX ||
      "resources",
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

export async function listIndexedUserResources(options = {}) {
  return listUserResourceDocuments(
    getRequiredUserResourceSearchClient(),
    getUserResourceSearchIndexName(),
    options
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

// --- Resource search (main resource table) ---

let cachedResourceClient = null;
let cachedResourceConfigKey = null;

export function isResourceSearchConfigured(config = getResourceSearchConfig()) {
  return Boolean(
    config.node &&
      config.username &&
      config.password &&
      config.caFingerprint &&
      config.indexName
  );
}

export function getOptionalResourceSearchClient() {
  const config = getResourceSearchConfig();
  if (!isResourceSearchConfigured(config)) {
    return null;
  }

  const configKey = buildConfigKey(config);
  if (!cachedResourceClient || cachedResourceConfigKey !== configKey) {
    cachedResourceClient = createSearchClient(config);
    cachedResourceConfigKey = configKey;
  }

  return cachedResourceClient;
}

export function getRequiredResourceSearchClient() {
  const client = getOptionalResourceSearchClient();
  if (!client) {
    throw new Error(
      "Elasticsearch is not fully configured for resources. Please set ELASTICSEARCH_NODE, ELASTICSEARCH_USERNAME, ELASTICSEARCH_PASSWORD, ELASTICSEARCH_CA_FINGERPRINT, and ELASTICSEARCH_RESOURCE_INDEX."
    );
  }

  return client;
}

export function getResourceSearchIndexName() {
  return getResourceSearchConfig().indexName;
}

export async function searchResources(keyword, size = 100) {
  const client = getOptionalResourceSearchClient();
  if (!client) {
    return [];
  }

  return searchResourceDocuments(
    client,
    getResourceSearchIndexName(),
    keyword,
    size
  );
}

export async function syncResource(resource) {
  return upsertResourceDocument(
    getRequiredResourceSearchClient(),
    getResourceSearchIndexName(),
    resource
  );
}

export async function removeResource(resourceId) {
  return deleteResourceDocument(
    getRequiredResourceSearchClient(),
    getResourceSearchIndexName(),
    resourceId
  );
}

export async function reindexResources(resources, options = {}) {
  return reindexResourceDocuments(
    getRequiredResourceSearchClient(),
    getResourceSearchIndexName(),
    resources,
    options
  );
}
