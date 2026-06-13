const lighthousePort = process.env.LHCI_PORT || "45173";
const websocketPort = process.env.LHCI_WS_PORT || "45174";
const baseUrl = process.env.LHCI_BASE_URL || `http://127.0.0.1:${lighthousePort}`;
const previewEnvironment = [
  "REDIS_URL=",
  "NUXT_PUBLIC_ENABLE_THIRD_PARTY_SCRIPTS=false",
  "TVBOX_SYNC_ENABLED=false",
  "USER_RESOURCE_AUTO_REVIEW_QUEUE_ENABLED=false",
  "USER_RESOURCE_AUTO_REVIEW_WORKER_ENABLED=false",
  `WS_PORT=${websocketPort}`,
].join(" ");
const startServerCommand =
  process.env.LHCI_START_SERVER_COMMAND ||
  [
    `node scripts/lighthouse-assert-port-free.mjs ${lighthousePort}`,
    `node scripts/lighthouse-assert-port-free.mjs ${websocketPort}`,
    `${previewEnvironment} npm run preview -- --host 127.0.0.1 --port ${lighthousePort}`,
  ].join(" && ");

module.exports = {
  ci: {
    collect: {
      startServerCommand,
      startServerReadyPattern: `Listening on http://.*:${lighthousePort}`,
      url: [`${baseUrl}/`, `${baseUrl}/about`],
      numberOfRuns: 3,
      settings: {
        chromeFlags: "--no-sandbox --disable-dev-shm-usage",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.5 }],
        "categories:accessibility": ["warn", { minScore: 0.8 }],
        "categories:best-practices": ["warn", { minScore: 0.8 }],
        "categories:seo": ["warn", { minScore: 0.8 }],
      },
    },
    upload: {
      target: process.env.LHCI_UPLOAD_TARGET || "filesystem",
      outputDir: ".lighthouseci",
    },
  },
};
