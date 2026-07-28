import assert from "node:assert/strict";
import test from "node:test";

import { sanitizeHtmlContent } from "../../utils/sanitizeCore.mjs";

test("SSR sanitizer removes executable markup while preserving markdown HTML", () => {
  const sanitized = sanitizeHtmlContent(
    '<h2 id="title">标题</h2><img src="x" onerror="alert(1)"><script>alert(2)</script><a href="javascript:alert(3)">链接</a>',
  );

  assert.match(sanitized, /<h2/);
  assert.match(sanitized, /标题/);
  assert.doesNotMatch(sanitized, /onerror/i);
  assert.doesNotMatch(sanitized, /<script/i);
  assert.doesNotMatch(sanitized, /javascript:/i);
});

test("SSR sanitizer rejects form controls, styles, and DOM clobbering names", () => {
  const sanitized = sanitizeHtmlContent(
    '<form><input name="location"></form><p id="redirectTo" style="position:fixed">正文</p>',
  );

  assert.doesNotMatch(sanitized, /<(?:form|input)/i);
  assert.doesNotMatch(sanitized, /\sstyle=/i);
  assert.doesNotMatch(sanitized, /id="redirectTo"/i);
  assert.match(sanitized, /正文/);
});
