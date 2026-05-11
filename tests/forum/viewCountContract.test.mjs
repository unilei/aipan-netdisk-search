import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const topicDetailSource = readFileSync(
  new URL("../../server/api/forum/topics/[slug].get.ts", import.meta.url),
  "utf8"
);

const topicViewSource = readFileSync(
  new URL("../../server/api/forum/topics/[slug]/view.get.ts", import.meta.url),
  "utf8"
);

test("forum topic detail fetch stays read-only for view counts", () => {
  assert.doesNotMatch(
    topicDetailSource,
    /viewCount\s*:\s*\{\s*increment\s*:\s*1\s*\}/,
    "topic detail API should not increment viewCount; the dedicated view endpoint owns that side effect"
  );
});

test("forum topic view endpoint remains the single view-count writer", () => {
  assert.match(
    topicViewSource,
    /viewCount\s*:\s*\{\s*increment\s*:\s*1\s*\}/,
    "dedicated topic view endpoint should increment viewCount"
  );
});
