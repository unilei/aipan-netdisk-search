import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import {
  resolveAuthenticatedUser,
} from "../../server/services/auth/authenticatedUser.mjs";

const readProjectFile = (path) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

test("authenticated user context uses current database role and status", () => {
  const result = resolveAuthenticatedUser({
    decoded: {
      userId: 7,
      role: "admin",
      iat: 1,
    },
    user: {
      id: 7,
      role: "user",
      status: "active",
    },
  });

  assert.equal(result.allowed, true);
  assert.equal(result.user.role, "user");
  assert.equal(result.user.status, "active");
});

test("disabled and deleted accounts cannot reuse a signed token", () => {
  assert.deepEqual(resolveAuthenticatedUser({
    decoded: { userId: 7, role: "admin" },
    user: { id: 7, role: "admin", status: "disabled" },
  }), {
    allowed: false,
    reason: "account_disabled",
  });

  assert.deepEqual(resolveAuthenticatedUser({
    decoded: { userId: 7, role: "admin" },
    user: null,
  }), {
    allowed: false,
    reason: "user_not_found",
  });
});

test("official Quark resource creation is only exposed below the admin API", () => {
  const publicRoute = new URL(
    "../../server/api/quark/post.ts",
    import.meta.url,
  );
  const adminRoute = readProjectFile("server/api/admin/quark/post.post.ts");

  assert.equal(existsSync(publicRoute), false);
  assert.match(adminRoute, /requireAdmin\(event\)/);
  assert.match(adminRoute, /creatorId:\s*user\.userId/);
  assert.doesNotMatch(adminRoute, /creatorId:\s*body/);
});

test("destructive user routes scope writes to the current owner", () => {
  const batchDelete = readProjectFile(
    "server/api/user/resources/batch-delete.ts",
  );
  const blogDelete = readProjectFile(
    "server/api/user/blog/posts/[id].delete.ts",
  );
  const commentDelete = readProjectFile(
    "server/api/blog/comments/[id].delete.ts",
  );

  assert.match(batchDelete, /prisma\.userResource\.deleteMany/);
  assert.match(batchDelete, /creatorId:\s*userId/);
  assert.doesNotMatch(batchDelete, /prisma\.resource\.deleteMany/);
  assert.match(blogDelete, /authorId:\s*userId/);
  assert.match(commentDelete, /event\.context\.user\?\.role === 'admin'/);
  assert.doesNotMatch(commentDelete, /user\?\.userId != null/);
});
