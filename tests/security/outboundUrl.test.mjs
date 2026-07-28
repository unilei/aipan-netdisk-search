import assert from "node:assert/strict";
import test from "node:test";

import {
  assertSafeRedirectOptions,
  assertSafeRemoteUrl,
  assertSafeRemoteUrlShape,
  isAllowedDeezerPreviewHost,
  isBlockedIpAddress,
} from "../../server/services/security/outboundUrl.mjs";

test("outbound URL policy blocks local and private address forms", () => {
  for (const address of [
    "127.0.0.1",
    "10.1.2.3",
    "169.254.169.254",
    "192.168.1.5",
    "::1",
    "::ffff:7f00:1",
    "fc00::1",
    "2002:7f00:1::",
  ]) {
    assert.equal(isBlockedIpAddress(address), true, address);
  }

  assert.equal(isBlockedIpAddress("::ffff:808:808"), false);
  assert.throws(
    () => assertSafeRemoteUrlShape("http://2130706433/internal"),
    /blocked/,
  );
  assert.throws(
    () => assertSafeRemoteUrlShape("file:///etc/passwd"),
    /protocol/,
  );
  assert.throws(
    () => assertSafeRemoteUrlShape("http://localhost/admin"),
    /hostname/,
  );
  assert.throws(
    () => assertSafeRemoteUrlShape("http://[::ffff:127.0.0.1]/internal"),
    /blocked/,
  );
  assert.throws(
    () => assertSafeRedirectOptions({
      protocol: "http:",
      hostname: "127.0.0.1",
    }),
    /blocked/,
  );
});

test("outbound URL policy rejects DNS answers containing a private address", async () => {
  await assert.rejects(
    () => assertSafeRemoteUrl("https://images.example.test/poster.jpg", {
      lookup: async () => [
        { address: "93.184.216.34", family: 4 },
        { address: "10.0.0.8", family: 4 },
      ],
    }),
    /blocked/,
  );

  const safe = await assertSafeRemoteUrl(
    "https://images.example.test/poster.jpg",
    {
      lookup: async () => [{ address: "93.184.216.34", family: 4 }],
    },
  );
  assert.equal(safe.hostname, "images.example.test");
});

test("Deezer preview allowlist uses domain boundaries instead of substrings", () => {
  assert.equal(isAllowedDeezerPreviewHost("cdnt-preview.dzcdn.net"), true);
  assert.equal(isAllowedDeezerPreviewHost("cdns-preview-8.dzcdn.net"), true);
  assert.equal(
    isAllowedDeezerPreviewHost("dzcdn.net.attacker.example"),
    false,
  );
  assert.equal(
    isAllowedDeezerPreviewHost("internal-dzcdn.net"),
    false,
  );
});
