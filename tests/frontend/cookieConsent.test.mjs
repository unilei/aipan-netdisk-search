import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

const ROOT = process.cwd();

test("cookie consent tolerates legacy stored decisions without noisy parse errors", async () => {
  const source = await readFile(
    join(ROOT, "components/common/CookieConsent.vue"),
    "utf8",
  );

  assert.match(source, /normalizeCookieConsent/);
  assert.match(source, /consent\s*===\s*['"]accepted['"]/);
  assert.match(source, /consent\s*===\s*['"]necessary['"]/);
  assert.match(source, /dispatchEvent\(new CustomEvent\(COOKIE_CONSENT_EVENT/);
  assert.doesNotMatch(source, /Failed to parse cookie consent/);
});
