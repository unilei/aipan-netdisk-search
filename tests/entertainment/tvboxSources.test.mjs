import assert from "node:assert/strict";
import test from "node:test";

import {
  getNextDailySyncAt,
  getDelayUntilNextDailySync,
  parseDailySyncTime,
} from "../../server/services/tvbox/scheduler.mjs";

import {
  fetchTvboxSources,
  mergeTvboxSourceGroups,
  parseTvboxArticleHtml,
  parseTvboxSourceHtml,
  parseUpdatedAt,
} from "../../server/services/tvbox/sources.mjs";

const singleGroup = {
  id: "single",
  label: "单仓源",
  url: "https://example.test/single",
};

const warehouseGroup = {
  id: "warehouse",
  label: "多仓源",
  url: "https://example.test/warehouse",
};

const discoveryGroup = {
  id: "yxzhi",
  type: "discovery",
  label: "扩展源",
  url: "https://example.test/article",
  parser: "article",
};

test("parseTvboxSourceHtml extracts source labels and links", () => {
  const html = `
    <p>所有接口都会不定期更新测试,更新时间：2026-04-12</p>
    <div class="row">
      <label>饭太硬</label>
      <input value="http://饭太硬.top/tv" />
    </div>
    <div class="row">
      <label>欧歌免费</label>
      <input value="https://tv.nxog.top/m/" />
    </div>
  `;

  assert.equal(parseUpdatedAt(html), "2026-04-12");

  const list = parseTvboxSourceHtml(html, singleGroup);

  assert.deepEqual(
    list.map((item) => ({
      name: item.name,
      link: item.link,
      sourceType: item.sourceType,
      sourceTypeLabel: item.sourceTypeLabel,
    })),
    [
      {
        name: "饭太硬",
        link: "http://饭太硬.top/tv",
        sourceType: "single",
        sourceTypeLabel: "单仓源",
      },
      {
        name: "欧歌免费",
        link: "https://tv.nxog.top/m/",
        sourceType: "single",
        sourceTypeLabel: "单仓源",
      },
    ]
  );
});

test("mergeTvboxSourceGroups dedupes by link while preserving group order", () => {
  const singleList = parseTvboxSourceHtml(
    `<label>肥猫接口</label><input value="http://肥猫.com" />`,
    singleGroup
  );
  const warehouseList = parseTvboxSourceHtml(
    `
      <label>肥猫备用</label><input value="http://肥猫.com" />
      <label>小盒子多仓</label><input value="http://xhztv.top/tvbox.txt" />
    `,
    warehouseGroup
  );

  const merged = mergeTvboxSourceGroups([
    { list: singleList },
    { list: warehouseList },
  ]);

  assert.equal(merged.length, 2);
  assert.equal(merged[0].name, "肥猫接口");
  assert.equal(merged[1].name, "小盒子多仓");
  assert.equal(merged[1].sourceType, "warehouse");
});

test("parseTvboxArticleHtml extracts source URLs from public list articles", () => {
  const html = `
    <article>
      <h2>TVBox 单仓Json</h2>
      <p>饭太硬</p>
      <p>http://饭太硬.top/tv</p>
      <p>多仓</p>
      <p>欧歌多仓：http://m.nxog.top/nxog/ou1.php?url=http://tv.nxog.top&amp;b=欧歌</p>
      <p>站内页面 https://www.yxzhi.com/9257.html</p>
      <img src="https://cdn.example.test/cover.png" />
    </article>
  `;

  const list = parseTvboxArticleHtml(html, discoveryGroup);

  assert.deepEqual(
    list.map((item) => ({
      name: item.name,
      link: item.link,
      sourceType: item.sourceType,
      sourceTypeLabel: item.sourceTypeLabel,
    })),
    [
      {
        name: "饭太硬",
        link: "http://饭太硬.top/tv",
        sourceType: "discovery",
        sourceTypeLabel: "扩展源",
      },
      {
        name: "欧歌多仓",
        link: "http://m.nxog.top/nxog/ou1.php?url=http://tv.nxog.top&b=欧歌",
        sourceType: "discovery",
        sourceTypeLabel: "扩展源",
      },
    ]
  );
});

test("fetchTvboxSources keeps successful groups when one upstream fails", async () => {
  const result = await fetchTvboxSources(async (url) => {
    if (url.includes("type=many")) {
      throw new Error("upstream timeout");
    }

    if (url.includes("type=local")) {
      return `
        <p>更新时间：2026-03-04</p>
        <label>202601合集</label><input value="https://pan.xunlei.com/s/example" />
      `;
    }

    if (url.includes("yxzhi.com")) {
      return `
        <p>饭太硬</p>
        <p>http://饭太硬.top/tv</p>
      `;
    }

    if (url.includes("yinghezhinan.com")) {
      return `
        <p>肥猫</p>
        <p>http://肥猫.com/</p>
      `;
    }

    return `
      <p>更新时间：2026-04-12</p>
      <label>饭太硬</label><input value="http://饭太硬.top/tv" />
    `;
  });

  assert.equal(result.list.length, 3);
  assert.deepEqual(
    result.meta.groups.map((group) => [group.id, group.count]),
    [
      ["single", 1],
      ["package", 1],
      ["yxzhi", 1],
      ["yinghezhinan", 1],
    ]
  );
  assert.deepEqual(result.meta.failedGroups.map((group) => group.id), [
    "warehouse",
  ]);
});

test("daily sync scheduler resolves the next wall-clock run", () => {
  assert.deepEqual(parseDailySyncTime("3:05"), { hour: 3, minute: 5 });
  assert.deepEqual(parseDailySyncTime("bad-input"), { hour: 3, minute: 20 });

  const beforeSync = new Date("2026-05-10T02:30:00+08:00");
  assert.equal(
    getNextDailySyncAt(beforeSync, "03:20").toISOString(),
    new Date("2026-05-10T03:20:00+08:00").toISOString(),
  );

  const afterSync = new Date("2026-05-10T04:00:00+08:00");
  assert.equal(
    getNextDailySyncAt(afterSync, "03:20").toISOString(),
    new Date("2026-05-11T03:20:00+08:00").toISOString(),
  );

  assert.equal(getDelayUntilNextDailySync(beforeSync, "02:31"), 60 * 1000);
});
