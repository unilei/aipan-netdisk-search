import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readProjectFile = (path) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

test("Lighthouse preview disables analytics and ad scripts through runtime config", () => {
  const lighthouseConfig = readProjectFile("lighthouserc.cjs");
  const workflow = readProjectFile(".github/workflows/lighthouse.yml");
  const nuxtConfig = readProjectFile("nuxt.config.ts");

  assert.match(lighthouseConfig, /NUXT_PUBLIC_ENABLE_THIRD_PARTY_SCRIPTS=false/);
  assert.match(workflow, /NUXT_PUBLIC_ENABLE_THIRD_PARTY_SCRIPTS:\s*"false"/);
  assert.match(nuxtConfig, /enableThirdPartyScripts/);
  assert.doesNotMatch(nuxtConfig, /googletagmanager\.com\/gtag\/js/);
  assert.doesNotMatch(nuxtConfig, /pagead2\.googlesyndication\.com/);
});

test("public pages defer local Font Awesome CSS outside the critical stylesheet", () => {
  const mainCss = readProjectFile("assets/css/main.css");
  const fontawesomePlugin = readProjectFile("plugins/fontawesome.client.ts");
  const nuxtConfig = readProjectFile("nuxt.config.ts");

  assert.doesNotMatch(mainCss, /@fortawesome\/fontawesome-free/);
  assert.match(fontawesomePlugin, /FONTAWESOME_IDLE_DELAY\s*=\s*8000/);
  assert.match(fontawesomePlugin, /@fortawesome\/fontawesome-free\/css\/fontawesome\.min\.css/);
  assert.match(fontawesomePlugin, /@fortawesome\/fontawesome-free\/css\/solid\.min\.css/);
  assert.doesNotMatch(nuxtConfig, /cdnjs\.cloudflare\.com\/ajax\/libs\/font-awesome/);
});

test("public pages avoid render-blocking remote font stylesheets in Lighthouse", () => {
  const nuxtConfig = readProjectFile("nuxt.config.ts");
  const tailwindConfig = readProjectFile("tailwind.config.mjs");

  assert.doesNotMatch(nuxtConfig, /@nuxtjs\/google-fonts/);
  assert.doesNotMatch(nuxtConfig, /googleFonts\s*:/);
  assert.doesNotMatch(nuxtConfig, /fonts\.googleapis\.com/);
  assert.match(tailwindConfig, /inter:\s*\["ui-sans-serif",\s*"system-ui",\s*"sans-serif"\]/);
});

test("home and netdisk header controls have accessible labels and contrast-safe dark text", () => {
  const homePage = readProjectFile("pages/index.vue");
  const netdiskHeader = readProjectFile("components/layout/netdisk/Header.vue");

  assert.match(homePage, /aria-label="\$t\('search_placeholder'\)"/);
  assert.match(homePage, /src="\/logo\.png"/);
  assert.match(netdiskHeader, /:aria-label="isMenuOpen \? '关闭菜单' : '打开菜单'"/);
  assert.match(netdiskHeader, /dark:text-gray-100/);
});

test("image proxy falls back to a successful placeholder response for upstream image failures", () => {
  const imageProxy = readProjectFile("server/api/image-proxy.get.ts");

  assert.match(imageProxy, /IMAGE_PROXY_FALLBACK_SVG/);
  assert.match(imageProxy, /X-Image-Proxy-Fallback/);
  assert.doesNotMatch(imageProxy, /statusMessage:\s*'Failed to fetch image'/);
});

test("homepage movie posters use direct URLs returned by the Douban service", () => {
  const imageBox = readProjectFile("components/home/DoubanImageBox.vue");

  assert.match(imageBox, /const getDoubanImageUrl = \(url\) =>/);
  assert.match(imageBox, /if \(!url\) return placeHolderImage/);
  assert.match(imageBox, /return url/);
  assert.match(imageBox, /:src="getDoubanImageUrl\(movie\.cover\)"/);
  assert.doesNotMatch(imageBox, /\/api\/image-proxy/);
  assert.match(imageBox, /movieIndex < 2/);
});

test("homepage refreshes its local cache for R2-backed Douban data", () => {
  const doubanApi = readProjectFile("server/api/douban/new.ts");
  const doubanCacheApi = readProjectFile("server/api/cache/douban.ts");

  assert.match(doubanApi, /https:\/\/iamyourfather\.link0\.me\/api\/v1\/new/);
  assert.match(doubanApi, /douban_homepage_data_r2_v1/);
  assert.match(doubanCacheApi, /douban_homepage_data_r2_v1/);
});

test("homepage defers the heavy Douban movie grid outside the critical rendering path", () => {
  const homePage = readProjectFile("pages/index.vue");

  assert.doesNotMatch(homePage, /useDoubanStore/);
  assert.match(homePage, /loadDeferredDoubanData/);
  assert.match(homePage, /cleanupDeferredDoubanSchedule/);
  assert.match(homePage, /removeEventListener\(eventName,\s*loadDeferredDoubanData\)/);
  assert.match(homePage, /DEFERRED_DOUBAN_FALLBACK_DELAY\s*=\s*15000/);
  assert.match(homePage, /min-h-\[1400px\]/);
  assert.match(homePage, /v-else-if="doubanData\.length > 0"/);
  assert.match(homePage, /DEFERRED_DOUBAN_INTERACTION_EVENTS/);
});

test("homepage keeps late navigation data and LCP logo from shifting the first viewport", () => {
  const homePage = readProjectFile("pages/index.vue");
  const nuxtConfig = readProjectFile("nuxt.config.ts");

  assert.match(homePage, /DEFAULT_HOME_NAVIGATION/);
  assert.match(homePage, /const categories = ref\(DEFAULT_HOME_NAVIGATION\)/);
  assert.match(homePage, /void loadNavigationData\(\)/);
  assert.doesNotMatch(homePage, /onBeforeMount\(async \(\) => {\s*await loadNavigationData\(\)/s);
  assert.match(homePage, /<source srcset="\/logo\.webp" type="image\/webp"/);
  assert.match(homePage, /fetchpriority="high"/);
  assert.match(homePage, /width="96"/);
  assert.match(homePage, /min-h-\[176px\]/);
  assert.match(nuxtConfig, /href:\s*'\/logo\.webp'/);
  assert.match(nuxtConfig, /\/logo\.webp/);
});

test("homepage avoids route chunk prefetching and non-critical release fetches during Lighthouse", () => {
  const nuxtConfig = readProjectFile("nuxt.config.ts");
  const releaseNotice = readProjectFile("composables/useReleaseNotice.ts");

  assert.match(nuxtConfig, /nuxtLink:\s*{\s*prefetch:\s*false/s);
  assert.match(releaseNotice, /RELEASE_NOTICE_IDLE_DELAY\s*=\s*8000/);
  assert.match(releaseNotice, /RELEASE_NOTICE_INTERACTION_EVENTS/);
  assert.match(releaseNotice, /setTimeout\(runScheduledReleaseNoticeLoad,\s*RELEASE_NOTICE_IDLE_DELAY\)/);
  assert.doesNotMatch(releaseNotice, /onMounted\(\(\) => {\s*loadLatestRelease\(\)/s);
});

test("Nitro preview compresses dynamic text responses without buffering SSR HTML", () => {
  const compressionMiddleware = readProjectFile("server/middleware/compression.ts");

  assert.match(compressionMiddleware, /createGzip/);
  assert.match(compressionMiddleware, /Z_SYNC_FLUSH/);
  assert.match(compressionMiddleware, /Content-Encoding/);
  assert.match(compressionMiddleware, /removeHeader\('Content-Length'\)/);
  assert.match(compressionMiddleware, /text\/html/);
  assert.match(compressionMiddleware, /application\/json/);
  assert.match(compressionMiddleware, /encoding\.name === 'gzip'/);
  assert.match(compressionMiddleware, /gzip\.quality > 0/);
  assert.doesNotMatch(compressionMiddleware, /Buffer\.concat/);
});
