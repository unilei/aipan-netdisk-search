import assert from "node:assert/strict";
import test from "node:test";

import { releaseNotes } from "../../utils/releaseNotes.js";

test("releaseNotes are sorted newest first", () => {
  const dates = releaseNotes.map((note) => note.date);
  assert.deepEqual(dates, [...dates].sort().reverse());
});

test("releaseNotes include the user resource auto review release", () => {
  const latest = releaseNotes[0];

  assert.match(latest.title, /用户投稿/);
  assert.ok(
    latest.highlights.some((highlight) => highlight.includes("自动审核"))
  );
  assert.ok(latest.highlights.some((highlight) => highlight.includes("ES")));
});
