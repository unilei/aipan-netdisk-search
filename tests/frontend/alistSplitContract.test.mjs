import { readFile } from "node:fs/promises";
import { join } from "node:path";
import assert from "node:assert/strict";
import test from "node:test";

const ROOT = process.cwd();

test("TV page no longer embeds AList browsing behavior", async () => {
  const content = await readFile(join(ROOT, "pages/tv/index.vue"), "utf8");

  assert.doesNotMatch(content, /AList|Alist|alist/);
  assert.doesNotMatch(content, /\/api\/fs\/(?:list|get)/);
  assert.doesNotMatch(content, /\/api\/alist\/(?:list|get|sources)/);
});

test("AList page uses only the local backend proxy", async () => {
  const content = await readFile(join(ROOT, "pages/alist/index.vue"), "utf8");

  assert.match(content, /\/api\/alist\/sources/);
  assert.match(content, /\/api\/alist\/list/);
  assert.match(content, /\/api\/alist\/get/);
  assert.doesNotMatch(content, /\/api\/fs\/(?:list|get)/);
});

test("AList page is protected by the same feature access gate as TV", async () => {
  const content = await readFile(join(ROOT, "pages/alist/index.vue"), "utf8");

  assert.match(content, /useFeatureAccess\(["']alist["']\)/);
  assert.match(content, /<FeatureAccessNotice/);
  assert.match(content, /feature-name=["']AList["']/);
  assert.match(content, /v-if=["']shouldShowAccessNotice["']/);
});

test("AList page supports media playback, downloads, and file details", async () => {
  const content = await readFile(join(ROOT, "pages/alist/index.vue"), "utf8");

  assert.match(content, /nativeAudioFilePattern/);
  assert.match(content, /audioPlayer/);
  assert.match(content, /currentFilePlayUrl/);
  assert.match(content, /下载 \/ 打开/);
  assert.match(content, /当前音频格式浏览器通常不支持在线播放/);
});

test("AList video playback initializes after the video surface is visible", async () => {
  const content = await readFile(join(ROOT, "pages/alist/index.vue"), "utf8");

  assert.match(content, /const loadVideo = async \(url\) =>/);
  assert.match(content, /await nextTick\(\)/);
  assert.match(content, /await loadVideo\(res\.data\.playUrl\)/);
});

test("AList video playback explains audio-only browser codec failures", async () => {
  const content = await readFile(join(ROOT, "pages/alist/index.vue"), "utf8");

  assert.match(content, /videoNoPicture/);
  assert.match(content, /videoWidth/);
  assert.match(content, /videoHeight/);
  assert.match(content, /浏览器不支持当前视频编码/);
});

test("music player does not directly call a hard-coded AList server", async () => {
  const content = await readFile(join(ROOT, "pages/music/player.vue"), "utf8");

  assert.doesNotMatch(content, /alist\.aipan\.me/);
  assert.doesNotMatch(content, /\/api\/fs\/(?:list|get)/);
});
