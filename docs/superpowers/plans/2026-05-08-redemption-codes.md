# Redemption Codes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a secure redemption-code feature where admins configure code-based point rewards and logged-in users redeem those codes from the user center.

**Architecture:** Add a dedicated redemption-code domain backed by Prisma tables for campaigns, codes, and redemption records. Reuse the existing points ledger: permanent rewards update `User.points` plus `PointsHistory`, while temporary rewards write expiring `PointsHistory` rows and are counted by `getUserPointsBreakdown()`. Keep business rules in `server/services/points/redemptionCodes.mjs`, expose thin H3 API handlers, and integrate the existing admin/user points UI.

**Tech Stack:** Nuxt 4, H3 server routes, Prisma with PostgreSQL, Element Plus, Pinia user store, Node test runner.

---

## File Structure

- Modify `prisma/schema.prisma`
  - Add `RedemptionCodeCampaign`, `RedemptionCode`, and `RedemptionCodeRedemption`.
  - Add relations from `User` and `PointsHistory`.

- Modify `.env.example` and `.env.production.example`
  - Add `REDEMPTION_CODE_HASH_SECRET`.

- Modify `server/services/points/pointsLedger.mjs`
  - Add `POINT_TYPES.redemption`.

- Create `server/services/points/redemptionCodes.mjs`
  - Code normalization, hashing, generation, input normalization, response shaping, redemption transaction.

- Create `tests/points/redemptionCodes.test.mjs`
  - Pure helper and decision tests.

- Create `server/api/user/points/redemption-codes/redeem.post.ts`
  - Authenticated user redemption endpoint.

- Create admin API files:
  - `server/api/admin/points/redemption-codes/campaigns/index.get.ts`
  - `server/api/admin/points/redemption-codes/campaigns/index.post.ts`
  - `server/api/admin/points/redemption-codes/campaigns/[id].put.ts`
  - `server/api/admin/points/redemption-codes/campaigns/[id]/codes.post.ts`
  - `server/api/admin/points/redemption-codes/codes/index.get.ts`
  - `server/api/admin/points/redemption-codes/redemptions/index.get.ts`

- Create `pages/admin/points/redemption-codes.vue`
  - Admin campaign, code, and redemption-record management UI.

- Modify `layouts/admin.vue`
  - Add admin sidebar link.

- Create `components/user/RedemptionCodeCard.vue`
  - User-facing redeem card.

- Modify `pages/user/checkin.vue`
  - Render redemption card and refresh point views after redemption.

- Modify point type labels:
  - `components/user/PointsOverview.vue`
  - `pages/user/checkin.vue`
  - `server/api/user/points/history.get.ts`
  - `server/api/admin/user-center/[id]/points.get.ts`
  - `pages/admin/users/index.vue`

---

### Task 1: Schema, Environment, And Point Type Foundation

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `.env.example`
- Modify: `.env.production.example`
- Modify: `server/services/points/pointsLedger.mjs`

- [ ] **Step 1: Extend Prisma schema**

Add these fields to `model User` near the existing points relations:

```prisma
  redemptionCodeCampaigns RedemptionCodeCampaign[] @relation("RedemptionCodeCampaignCreator")
  redemptionCodeRedemptions RedemptionCodeRedemption[]
```

Add this field to `model PointsHistory`:

```prisma
  redemptionCodeRedemption RedemptionCodeRedemption?
```

Add these models after `PointTaskCompletion`:

```prisma
model RedemptionCodeCampaign {
  id                      Int       @id @default(autoincrement())
  name                    String
  description             String?   @db.Text
  rewardType              String    @default("points")
  points                  Int
  pointsExpiresInMinutes  Int?
  enabled                 Boolean   @default(true)
  startsAt                DateTime?
  endsAt                  DateTime?
  maxRedemptionsPerUser   Int       @default(1)
  createdById             Int?
  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt

  createdBy   User?                      @relation("RedemptionCodeCampaignCreator", fields: [createdById], references: [id], onDelete: SetNull)
  codes       RedemptionCode[]
  redemptions RedemptionCodeRedemption[]

  @@index([enabled])
  @@index([startsAt])
  @@index([endsAt])
  @@index([createdAt])
}

model RedemptionCode {
  id             Int      @id @default(autoincrement())
  campaignId     Int
  codeHash       String   @unique
  codePrefix     String?
  codeSuffix     String?
  batchName      String?
  maxRedemptions Int?
  usedCount      Int      @default(0)
  enabled        Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  campaign   RedemptionCodeCampaign     @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  redemptions RedemptionCodeRedemption[]

  @@index([campaignId])
  @@index([enabled])
  @@index([batchName])
  @@index([createdAt])
}

model RedemptionCodeRedemption {
  id              Int       @id @default(autoincrement())
  userId          Int
  campaignId      Int
  codeId          Int
  points          Int
  expiresAt       DateTime?
  pointsHistoryId Int?      @unique
  ipHash          String?
  userAgentHash   String?
  createdAt       DateTime  @default(now())

  user          User                   @relation(fields: [userId], references: [id], onDelete: Cascade)
  campaign      RedemptionCodeCampaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  code          RedemptionCode         @relation(fields: [codeId], references: [id], onDelete: Cascade)
  pointsHistory PointsHistory?         @relation(fields: [pointsHistoryId], references: [id], onDelete: SetNull)

  @@unique([userId, codeId])
  @@index([userId])
  @@index([campaignId])
  @@index([codeId])
  @@index([createdAt])
}
```

- [ ] **Step 2: Add environment variable examples**

In `.env.example`, add under `# Security`:

```dotenv
REDEMPTION_CODE_HASH_SECRET=change-me
```

In `.env.production.example`, add under `# Runtime security`:

```dotenv
REDEMPTION_CODE_HASH_SECRET=change-me
```

- [ ] **Step 3: Add the points ledger type**

In `server/services/points/pointsLedger.mjs`, extend `POINT_TYPES`:

```js
export const POINT_TYPES = {
  checkin: "checkin",
  bonus: "bonus",
  consume: "consume",
  admin: "admin",
  activity: "activity",
  task: "task",
  transfer: "transfer",
  redemption: "redemption",
};
```

- [ ] **Step 4: Validate Prisma schema**

Run:

```bash
npx prisma validate
```

Expected: PASS with a valid Prisma schema.

- [ ] **Step 5: Commit foundation changes**

Run:

```bash
git add prisma/schema.prisma .env.example .env.production.example server/services/points/pointsLedger.mjs
git commit -m "feat: add redemption code schema foundation"
```

Expected: local commit created.

---

### Task 2: Pure Redemption Code Helpers And Tests

**Files:**
- Create: `tests/points/redemptionCodes.test.mjs`
- Create: `server/services/points/redemptionCodes.mjs`

- [ ] **Step 1: Write failing helper tests**

Create `tests/points/redemptionCodes.test.mjs`:

```js
import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRedemptionCodeHash,
  generateRedemptionCode,
  getRedemptionCodeMask,
  normalizeCampaignInput,
  normalizeGeneratedCodeOptions,
  normalizeRedeemCode,
  resolveRedemptionEligibility,
} from "../../server/services/points/redemptionCodes.mjs";

const NOW = new Date("2026-05-08T08:00:00.000Z");

test("normalizeRedeemCode accepts common human input variations", () => {
  assert.equal(normalizeRedeemCode(" aipan-7k4m 9q2x "), "AIPAN7K4M9Q2X");
});

test("buildRedemptionCodeHash is deterministic and secret-bound", () => {
  const first = buildRedemptionCodeHash("AIPAN7K4M9Q2X", "secret-a");
  const second = buildRedemptionCodeHash("aipan-7k4m-9q2x", "secret-a");
  const third = buildRedemptionCodeHash("AIPAN7K4M9Q2X", "secret-b");

  assert.equal(first, second);
  assert.notEqual(first, third);
  assert.match(first, /^[a-f0-9]{64}$/);
});

test("generateRedemptionCode creates readable chunked codes", () => {
  const code = generateRedemptionCode({
    prefix: "AIPAN",
    randomBytes: Buffer.from("1234567890abcdef1234567890abcdef", "hex"),
  });

  assert.match(code, /^AIPAN-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  assert.equal(normalizeRedeemCode(code).startsWith("AIPAN"), true);
});

test("getRedemptionCodeMask exposes only short prefix and suffix", () => {
  assert.deepEqual(getRedemptionCodeMask("AIPAN-7K4M-9Q2X-H8FD"), {
    codePrefix: "AIPAN",
    codeSuffix: "H8FD",
    maskedCode: "AIPAN...H8FD",
  });
});

test("normalizeGeneratedCodeOptions clamps admin generation input", () => {
  assert.deepEqual(normalizeGeneratedCodeOptions({
    quantity: "1200",
    prefix: " ai_pan! ",
    batchName: " Launch ",
    maxRedemptions: "0",
    enabled: false,
  }), {
    quantity: 1000,
    prefix: "AIPAN",
    batchName: "Launch",
    maxRedemptions: 1,
    enabled: false,
  });
});

test("normalizeCampaignInput accepts permanent and temporary rewards", () => {
  assert.deepEqual(normalizeCampaignInput({
    name: "  Launch gift ",
    description: "  First batch ",
    points: "500",
    rewardMode: "temporary",
    pointsExpiresInMinutes: "1440",
    enabled: false,
    maxRedemptionsPerUser: "2",
  }), {
    name: "Launch gift",
    description: "First batch",
    rewardType: "points",
    points: 500,
    pointsExpiresInMinutes: 1440,
    enabled: false,
    startsAt: null,
    endsAt: null,
    maxRedemptionsPerUser: 2,
  });

  assert.equal(normalizeCampaignInput({
    name: "Permanent gift",
    points: "100",
    rewardMode: "permanent",
  }).pointsExpiresInMinutes, null);
});

test("resolveRedemptionEligibility rejects unavailable codes and campaigns", () => {
  assert.equal(resolveRedemptionEligibility({
    code: null,
    now: NOW,
  }).reason, "not_found");

  assert.equal(resolveRedemptionEligibility({
    code: { enabled: false, campaign: { enabled: true } },
    now: NOW,
  }).reason, "code_disabled");

  assert.equal(resolveRedemptionEligibility({
    code: { enabled: true, usedCount: 2, maxRedemptions: 2, campaign: { enabled: true } },
    now: NOW,
  }).reason, "code_exhausted");

  assert.equal(resolveRedemptionEligibility({
    code: { enabled: true, usedCount: 0, maxRedemptions: 1, campaign: { enabled: false } },
    now: NOW,
  }).reason, "campaign_disabled");
});

test("resolveRedemptionEligibility accepts active campaign and code", () => {
  assert.deepEqual(resolveRedemptionEligibility({
    code: {
      enabled: true,
      usedCount: 0,
      maxRedemptions: 10,
      campaign: {
        enabled: true,
        startsAt: new Date("2026-05-07T08:00:00.000Z"),
        endsAt: new Date("2026-05-09T08:00:00.000Z"),
      },
    },
    userCampaignRedemptionCount: 0,
    userCodeRedeemed: false,
    now: NOW,
  }), {
    redeemable: true,
    reason: "redeemable",
    message: "",
  });
});
```

- [ ] **Step 2: Run the new tests and verify failure**

Run:

```bash
node --test tests/points/redemptionCodes.test.mjs
```

Expected: FAIL because `server/services/points/redemptionCodes.mjs` does not exist.

- [ ] **Step 3: Implement pure helpers**

Create `server/services/points/redemptionCodes.mjs` with these exports first:

```js
import crypto from "node:crypto";

export const REDEMPTION_LIMITS = {
  nameMaxLength: 80,
  descriptionMaxLength: 300,
  maxPoints: 100000000,
  maxExpireMinutes: 525600,
  maxPerUserLimit: 10,
  maxBatchQuantity: 1000,
  maxBatchNameLength: 80,
};

const normalizeString = (value) => String(value || "").trim();

const normalizeInteger = (value, fallback, min, max) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
};

export const normalizeRedeemCode = (value) =>
  normalizeString(value).toUpperCase().replace(/[\s-]+/g, "");

export const buildRedemptionCodeHash = (code, secret = process.env.REDEMPTION_CODE_HASH_SECRET) => {
  const canonicalCode = normalizeRedeemCode(code);
  const normalizedSecret = normalizeString(secret);

  if (!canonicalCode) {
    throw new Error("兑换码不能为空");
  }
  if (!normalizedSecret) {
    throw new Error("兑换码哈希密钥未配置");
  }

  return crypto
    .createHash("sha256")
    .update(`${normalizedSecret}:${canonicalCode}`)
    .digest("hex");
};

export const getRedemptionCodeMask = (code) => {
  const canonicalCode = normalizeRedeemCode(code);
  const codePrefix = canonicalCode.slice(0, 5) || null;
  const codeSuffix = canonicalCode.slice(-4) || null;

  return {
    codePrefix,
    codeSuffix,
    maskedCode: [codePrefix, codeSuffix].filter(Boolean).join("..."),
  };
};

export const generateRedemptionCode = ({
  prefix = "AIPAN",
  randomBytes,
} = {}) => {
  const normalizedPrefix =
    normalizeString(prefix).toUpperCase().replace(/[^A-Z0-9]+/g, "").slice(0, 8) || "AIPAN";
  const bytes = randomBytes || crypto.randomBytes(9);
  const body = bytes
    .toString("base64url")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 12)
    .padEnd(12, "X");
  const chunks = body.match(/.{1,4}/g) || [body];

  return [normalizedPrefix, ...chunks].join("-");
};

export const normalizeGeneratedCodeOptions = (input = {}) => ({
  quantity: normalizeInteger(input.quantity, 1, 1, REDEMPTION_LIMITS.maxBatchQuantity),
  prefix:
    normalizeString(input.prefix).toUpperCase().replace(/[^A-Z0-9]+/g, "").slice(0, 8) ||
    "AIPAN",
  batchName: normalizeString(input.batchName).slice(0, REDEMPTION_LIMITS.maxBatchNameLength) || null,
  maxRedemptions: normalizeInteger(input.maxRedemptions, 1, 1, 100000000),
  enabled: input.enabled === undefined ? true : Boolean(input.enabled),
});

export const normalizeCampaignInput = (input = {}) => {
  const name = normalizeString(input.name);
  if (!name) throw new Error("活动名称不能为空");
  if (name.length > REDEMPTION_LIMITS.nameMaxLength) {
    throw new Error(`活动名称不能超过 ${REDEMPTION_LIMITS.nameMaxLength} 个字符`);
  }

  const description = normalizeString(input.description);
  if (description.length > REDEMPTION_LIMITS.descriptionMaxLength) {
    throw new Error(`活动说明不能超过 ${REDEMPTION_LIMITS.descriptionMaxLength} 个字符`);
  }

  const points = normalizeInteger(input.points, 0, 1, REDEMPTION_LIMITS.maxPoints);
  const rewardMode = normalizeString(input.rewardMode || "permanent").toLowerCase();
  const pointsExpiresInMinutes =
    rewardMode === "temporary"
      ? normalizeInteger(input.pointsExpiresInMinutes, 1440, 1, REDEMPTION_LIMITS.maxExpireMinutes)
      : null;

  return {
    name,
    description,
    rewardType: "points",
    points,
    pointsExpiresInMinutes,
    enabled: input.enabled === undefined ? true : Boolean(input.enabled),
    startsAt: input.startsAt ? new Date(input.startsAt) : null,
    endsAt: input.endsAt ? new Date(input.endsAt) : null,
    maxRedemptionsPerUser: normalizeInteger(
      input.maxRedemptionsPerUser,
      1,
      1,
      REDEMPTION_LIMITS.maxPerUserLimit,
    ),
  };
};

const toDateOrNull = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const resolveRedemptionEligibility = ({
  code,
  userCampaignRedemptionCount = 0,
  userCodeRedeemed = false,
  now = new Date(),
}) => {
  const currentTime = toDateOrNull(now) || new Date();

  if (!code) {
    return { redeemable: false, reason: "not_found", message: "兑换码无效或不可用" };
  }
  if (!code.enabled) {
    return { redeemable: false, reason: "code_disabled", message: "兑换码无效或不可用" };
  }
  if (code.maxRedemptions !== null && code.maxRedemptions !== undefined && Number(code.usedCount || 0) >= Number(code.maxRedemptions)) {
    return { redeemable: false, reason: "code_exhausted", message: "该活动已达到兑换上限" };
  }

  const campaign = code.campaign;
  if (!campaign || !campaign.enabled) {
    return { redeemable: false, reason: "campaign_disabled", message: "兑换码无效或不可用" };
  }

  const startsAt = toDateOrNull(campaign.startsAt);
  const endsAt = toDateOrNull(campaign.endsAt);
  if (startsAt && startsAt > currentTime) {
    return { redeemable: false, reason: "not_started", message: "兑换码无效或不可用" };
  }
  if (endsAt && endsAt <= currentTime) {
    return { redeemable: false, reason: "expired", message: "兑换码无效或不可用" };
  }
  if (userCodeRedeemed) {
    return { redeemable: false, reason: "already_redeemed", message: "该兑换码已被兑换" };
  }
  if (Number(userCampaignRedemptionCount || 0) >= Number(campaign.maxRedemptionsPerUser || 1)) {
    return { redeemable: false, reason: "campaign_user_limit", message: "该活动已达到兑换上限" };
  }

  return { redeemable: true, reason: "redeemable", message: "" };
};
```

- [ ] **Step 4: Run helper tests**

Run:

```bash
node --test tests/points/redemptionCodes.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit helper layer**

Run:

```bash
git add server/services/points/redemptionCodes.mjs tests/points/redemptionCodes.test.mjs
git commit -m "feat: add redemption code helper service"
```

Expected: local commit created.

---

### Task 3: Redemption Transaction Service

**Files:**
- Modify: `server/services/points/redemptionCodes.mjs`
- Modify: `tests/points/redemptionCodes.test.mjs`

- [ ] **Step 1: Add grant-plan tests**

Append to `tests/points/redemptionCodes.test.mjs`:

```js
import {
  buildRedemptionGrantPlan,
} from "../../server/services/points/redemptionCodes.mjs";

test("buildRedemptionGrantPlan creates permanent point grants", () => {
  assert.deepEqual(buildRedemptionGrantPlan({
    campaign: {
      name: "Launch",
      points: 500,
      pointsExpiresInMinutes: null,
    },
    now: NOW,
  }), {
    points: 500,
    expiresAt: null,
    isTemporary: false,
    description: "兑换码奖励：Launch",
  });
});

test("buildRedemptionGrantPlan creates temporary point grants", () => {
  const plan = buildRedemptionGrantPlan({
    campaign: {
      name: "Launch",
      points: 500,
      pointsExpiresInMinutes: 60,
    },
    now: NOW,
  });

  assert.equal(plan.points, 500);
  assert.equal(plan.isTemporary, true);
  assert.equal(plan.expiresAt.toISOString(), "2026-05-08T09:00:00.000Z");
});
```

- [ ] **Step 2: Run the grant-plan tests and verify failure**

Run:

```bash
node --test tests/points/redemptionCodes.test.mjs
```

Expected: FAIL because `buildRedemptionGrantPlan` is not exported.

- [ ] **Step 3: Add transaction exports**

Append these imports near the top of `server/services/points/redemptionCodes.mjs`:

```js
import prisma from "~/lib/prisma";
import { getUserPointsBreakdown, POINT_TYPES } from "~/server/services/points/userPoints";
```

Append these exports to `server/services/points/redemptionCodes.mjs`:

```js
const hashRequestValue = (value) => {
  const normalized = normalizeString(value);
  if (!normalized) return null;
  return crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 32);
};

export const buildRedemptionGrantPlan = ({ campaign, now = new Date() }) => {
  const points = Number(campaign?.points || 0);
  const durationMinutes = Number(campaign?.pointsExpiresInMinutes || 0);
  const isTemporary = durationMinutes > 0;
  const expiresAt = isTemporary
    ? new Date((toDateOrNull(now) || new Date()).getTime() + durationMinutes * 60 * 1000)
    : null;

  return {
    points,
    expiresAt,
    isTemporary,
    description: `兑换码奖励：${campaign?.name || "兑换活动"}`,
  };
};

export const redeemCodeForUser = async ({
  userId,
  code,
  ip,
  userAgent,
  now = new Date(),
  client = prisma,
}) => {
  const codeHash = buildRedemptionCodeHash(code);

  return client.$transaction(async (tx) => {
    const redemptionCode = await tx.redemptionCode.findUnique({
      where: { codeHash },
      include: { campaign: true },
    });

    const userCodeRedeemed = redemptionCode
      ? await tx.redemptionCodeRedemption.findFirst({
          where: { userId, codeId: redemptionCode.id },
          select: { id: true },
        })
      : null;

    const userCampaignRedemptionCount = redemptionCode
      ? await tx.redemptionCodeRedemption.count({
          where: { userId, campaignId: redemptionCode.campaignId },
        })
      : 0;

    const decision = resolveRedemptionEligibility({
      code: redemptionCode,
      userCampaignRedemptionCount,
      userCodeRedeemed: Boolean(userCodeRedeemed),
      now,
    });

    if (!decision.redeemable) {
      throw createError({
        statusCode: decision.reason === "already_redeemed" ? 409 : 400,
        statusMessage: decision.message,
      });
    }

    const updateResult = await tx.redemptionCode.updateMany({
      where: {
        id: redemptionCode.id,
        enabled: true,
        OR: [
          { maxRedemptions: null },
          { usedCount: { lt: redemptionCode.maxRedemptions } },
        ],
      },
      data: {
        usedCount: { increment: 1 },
      },
    });

    if (updateResult.count !== 1) {
      throw createError({
        statusCode: 409,
        statusMessage: "该活动已达到兑换上限",
      });
    }

    const grant = buildRedemptionGrantPlan({
      campaign: redemptionCode.campaign,
      now,
    });

    let permanentPoints = null;
    if (!grant.isTemporary) {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { points: { increment: grant.points } },
        select: { points: true },
      });
      permanentPoints = updatedUser.points;
    } else {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { points: true },
      });
      permanentPoints = Number(user?.points || 0);
    }

    const pointsHistory = await tx.pointsHistory.create({
      data: {
        userId,
        points: grant.points,
        type: POINT_TYPES.redemption,
        description: grant.description,
        relatedId: redemptionCode.campaignId,
        expiresAt: grant.expiresAt,
      },
    });

    const redemption = await tx.redemptionCodeRedemption.create({
      data: {
        userId,
        campaignId: redemptionCode.campaignId,
        codeId: redemptionCode.id,
        points: grant.points,
        expiresAt: grant.expiresAt,
        pointsHistoryId: pointsHistory.id,
        ipHash: hashRequestValue(ip),
        userAgentHash: hashRequestValue(userAgent),
      },
    });

    const pointsBreakdown = await getUserPointsBreakdown(userId, {
      client: tx,
      permanentPoints,
      now,
    });

    return {
      granted: true,
      points: grant.points,
      isTemporary: grant.isTemporary,
      expiresAt: grant.expiresAt,
      redemption,
      campaign: redemptionCode.campaign,
      totalPoints: pointsBreakdown.effectivePoints,
      permanentPoints: pointsBreakdown.permanentPoints,
      temporaryPoints: pointsBreakdown.temporaryPoints,
      effectivePoints: pointsBreakdown.effectivePoints,
      nextExpiringAt: pointsBreakdown.nextExpiringAt,
      pointsBreakdown,
    };
  });
};
```

- [ ] **Step 4: Run tests**

Run:

```bash
node --test tests/points/redemptionCodes.test.mjs tests/points/pointsLedger.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit transaction service**

Run:

```bash
git add server/services/points/redemptionCodes.mjs tests/points/redemptionCodes.test.mjs
git commit -m "feat: add redemption code grant service"
```

Expected: local commit created.

---

### Task 4: User Redemption API

**Files:**
- Create: `server/api/user/points/redemption-codes/redeem.post.ts`

- [ ] **Step 1: Create the endpoint**

Create `server/api/user/points/redemption-codes/redeem.post.ts`:

```ts
import { redeemCodeForUser } from "~/server/services/points/redemptionCodes.mjs";
import { createRateLimiter } from "~/server/utils/rateLimit";

const redemptionLimiter = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 10,
});

const getClientIp = (event: any) => {
  const forwardedFor = getRequestHeader(event, "x-forwarded-for");
  return String(forwardedFor || event.node.req.socket?.remoteAddress || "unknown")
    .split(",")[0]
    .trim();
};

export default defineEventHandler(async (event) => {
  const userId = event.context.user?.userId;
  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: "请先登录",
    });
  }

  const clientIp = getClientIp(event);
  if (
    redemptionLimiter.isLimited(`user:${userId}`) ||
    redemptionLimiter.isLimited(`ip:${clientIp}`)
  ) {
    throw createError({
      statusCode: 429,
      statusMessage: "请求过于频繁，请稍后再试",
    });
  }

  const body = await readBody(event);
  const result = await redeemCodeForUser({
    userId,
    code: body?.code,
    ip: clientIp,
    userAgent: getRequestHeader(event, "user-agent"),
  });

  return {
    code: 200,
    msg: "兑换成功",
    data: {
      granted: result.granted,
      points: result.points,
      isTemporary: result.isTemporary,
      expiresAt: result.expiresAt,
      totalPoints: result.totalPoints,
      permanentPoints: result.permanentPoints,
      temporaryPoints: result.temporaryPoints,
      effectivePoints: result.effectivePoints,
      nextExpiringAt: result.nextExpiringAt,
      pointsBreakdown: result.pointsBreakdown,
    },
  };
});
```

- [ ] **Step 2: Run type/build validation**

Run:

```bash
npm run build
```

Expected: PASS. If build fails because generated Prisma client does not contain new models, run the project Prisma generation step after applying the migration, then rerun the build.

- [ ] **Step 3: Commit user API**

Run:

```bash
git add server/api/user/points/redemption-codes/redeem.post.ts
git commit -m "feat: add user redemption code endpoint"
```

Expected: local commit created.

---

### Task 5: Admin Redemption APIs

**Files:**
- Create: `server/api/admin/points/redemption-codes/campaigns/index.get.ts`
- Create: `server/api/admin/points/redemption-codes/campaigns/index.post.ts`
- Create: `server/api/admin/points/redemption-codes/campaigns/[id].put.ts`
- Create: `server/api/admin/points/redemption-codes/campaigns/[id]/codes.post.ts`
- Create: `server/api/admin/points/redemption-codes/codes/index.get.ts`
- Create: `server/api/admin/points/redemption-codes/redemptions/index.get.ts`
- Modify: `server/services/points/redemptionCodes.mjs`

- [ ] **Step 1: Add admin service exports**

Append these exports to `server/services/points/redemptionCodes.mjs`:

```js
export const createRedemptionCodesForCampaign = async ({
  campaignId,
  input = {},
  client = prisma,
}) => {
  const options = normalizeGeneratedCodeOptions(input);
  const createdCodes = [];

  for (let index = 0; index < options.quantity; index += 1) {
    let plaintextCode = "";
    let codeHash = "";

    for (let attempt = 0; attempt < 5; attempt += 1) {
      plaintextCode = generateRedemptionCode({ prefix: options.prefix });
      codeHash = buildRedemptionCodeHash(plaintextCode);
      const existing = await client.redemptionCode.findUnique({
        where: { codeHash },
        select: { id: true },
      });
      if (!existing) break;
    }

    const mask = getRedemptionCodeMask(plaintextCode);
    const record = await client.redemptionCode.create({
      data: {
        campaignId,
        codeHash,
        codePrefix: mask.codePrefix,
        codeSuffix: mask.codeSuffix,
        batchName: options.batchName,
        maxRedemptions: options.maxRedemptions,
        enabled: options.enabled,
      },
    });

    createdCodes.push({
      id: record.id,
      code: plaintextCode,
      maskedCode: mask.maskedCode,
      batchName: record.batchName,
      maxRedemptions: record.maxRedemptions,
      enabled: record.enabled,
    });
  }

  return createdCodes;
};

export const toAdminCampaignPayload = (campaign) => ({
  id: campaign.id,
  name: campaign.name,
  description: campaign.description || "",
  rewardType: campaign.rewardType,
  points: campaign.points,
  pointsExpiresInMinutes: campaign.pointsExpiresInMinutes,
  enabled: campaign.enabled,
  startsAt: campaign.startsAt,
  endsAt: campaign.endsAt,
  maxRedemptionsPerUser: campaign.maxRedemptionsPerUser,
  codeCount: campaign._count?.codes || 0,
  redemptionCount: campaign._count?.redemptions || 0,
  createdAt: campaign.createdAt,
  updatedAt: campaign.updatedAt,
});
```

- [ ] **Step 2: Add campaign list endpoint**

Create `server/api/admin/points/redemption-codes/campaigns/index.get.ts`:

```ts
import prisma from "~/lib/prisma";
import { toAdminCampaignPayload } from "~/server/services/points/redemptionCodes.mjs";

export default defineEventHandler(async () => {
  const campaigns = await prisma.redemptionCodeCampaign.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          codes: true,
          redemptions: true,
        },
      },
    },
  });

  return {
    code: 200,
    msg: "获取成功",
    data: campaigns.map(toAdminCampaignPayload),
  };
});
```

- [ ] **Step 3: Add campaign create endpoint**

Create `server/api/admin/points/redemption-codes/campaigns/index.post.ts`:

```ts
import prisma from "~/lib/prisma";
import { normalizeCampaignInput, toAdminCampaignPayload } from "~/server/services/points/redemptionCodes.mjs";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const data = normalizeCampaignInput(body);

  const campaign = await prisma.redemptionCodeCampaign.create({
    data: {
      ...data,
      createdById: event.context.user?.userId || null,
    },
    include: {
      _count: {
        select: {
          codes: true,
          redemptions: true,
        },
      },
    },
  });

  return {
    code: 200,
    msg: "兑换活动已创建",
    data: toAdminCampaignPayload(campaign),
  };
});
```

- [ ] **Step 4: Add campaign update endpoint**

Create `server/api/admin/points/redemption-codes/campaigns/[id].put.ts`:

```ts
import prisma from "~/lib/prisma";
import { normalizeCampaignInput, toAdminCampaignPayload } from "~/server/services/points/redemptionCodes.mjs";

export default defineEventHandler(async (event) => {
  const id = Number.parseInt(getRouterParam(event, "id") || "", 10);
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "活动 ID 不正确",
    });
  }

  const existing = await prisma.redemptionCodeCampaign.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          redemptions: true,
        },
      },
    },
  });
  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: "兑换活动不存在",
    });
  }

  const body = await readBody(event);
  const data = normalizeCampaignInput(body);
  const updateData = existing._count.redemptions > 0
    ? {
        name: data.name,
        description: data.description,
        enabled: data.enabled,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        maxRedemptionsPerUser: data.maxRedemptionsPerUser,
      }
    : data;

  const campaign = await prisma.redemptionCodeCampaign.update({
    where: { id },
    data: updateData,
    include: {
      _count: {
        select: {
          codes: true,
          redemptions: true,
        },
      },
    },
  });

  return {
    code: 200,
    msg: "兑换活动已更新",
    data: toAdminCampaignPayload(campaign),
  };
});
```

- [ ] **Step 5: Add code generation endpoint**

Create `server/api/admin/points/redemption-codes/campaigns/[id]/codes.post.ts`:

```ts
import prisma from "~/lib/prisma";
import { createRedemptionCodesForCampaign } from "~/server/services/points/redemptionCodes.mjs";

export default defineEventHandler(async (event) => {
  const campaignId = Number.parseInt(getRouterParam(event, "id") || "", 10);
  if (!Number.isInteger(campaignId) || campaignId <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "活动 ID 不正确",
    });
  }

  const campaign = await prisma.redemptionCodeCampaign.findUnique({
    where: { id: campaignId },
    select: { id: true },
  });
  if (!campaign) {
    throw createError({
      statusCode: 404,
      statusMessage: "兑换活动不存在",
    });
  }

  const body = await readBody(event);
  const codes = await createRedemptionCodesForCampaign({
    campaignId,
    input: body,
  });

  return {
    code: 200,
    msg: "兑换码已生成，请立即导出保存",
    data: {
      createdCount: codes.length,
      codes,
    },
  };
});
```

- [ ] **Step 6: Add admin code list endpoint**

Create `server/api/admin/points/redemption-codes/codes/index.get.ts`:

```ts
import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const campaignId = query.campaignId ? Number(query.campaignId) : null;

  const codes = await prisma.redemptionCode.findMany({
    where: campaignId ? { campaignId } : {},
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      campaign: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return {
    code: 200,
    msg: "获取成功",
    data: codes.map((item: any) => ({
      id: item.id,
      campaignId: item.campaignId,
      campaignName: item.campaign.name,
      maskedCode: [item.codePrefix, item.codeSuffix].filter(Boolean).join("..."),
      batchName: item.batchName,
      maxRedemptions: item.maxRedemptions,
      usedCount: item.usedCount,
      enabled: item.enabled,
      createdAt: item.createdAt,
    })),
  };
});
```

- [ ] **Step 7: Add admin redemption list endpoint**

Create `server/api/admin/points/redemption-codes/redemptions/index.get.ts`:

```ts
import prisma from "~/lib/prisma";

export default defineEventHandler(async () => {
  const redemptions = await prisma.redemptionCodeRedemption.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
      campaign: {
        select: {
          id: true,
          name: true,
          pointsExpiresInMinutes: true,
        },
      },
      code: {
        select: {
          codePrefix: true,
          codeSuffix: true,
          batchName: true,
        },
      },
    },
  });

  return {
    code: 200,
    msg: "获取成功",
    data: redemptions.map((item: any) => ({
      id: item.id,
      user: item.user,
      campaignId: item.campaignId,
      campaignName: item.campaign.name,
      maskedCode: [item.code.codePrefix, item.code.codeSuffix].filter(Boolean).join("..."),
      batchName: item.code.batchName,
      points: item.points,
      isTemporary: Boolean(item.expiresAt),
      expiresAt: item.expiresAt,
      createdAt: item.createdAt,
    })),
  };
});
```

- [ ] **Step 8: Run build validation**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 9: Commit admin APIs**

Run:

```bash
git add server/services/points/redemptionCodes.mjs server/api/admin/points/redemption-codes server/api/user/points/redemption-codes
git commit -m "feat: add redemption code APIs"
```

Expected: local commit created.

---

### Task 6: Admin Redemption Codes UI

**Files:**
- Create: `pages/admin/points/redemption-codes.vue`
- Modify: `layouts/admin.vue`

- [ ] **Step 1: Add admin sidebar link**

In `layouts/admin.vue`, in the `system` group under `积分任务`, add:

```js
{ title: '兑换码', path: '/admin/points/redemption-codes', icon: 'fas fa-ticket-alt' },
```

- [ ] **Step 2: Create the admin page**

Create `pages/admin/points/redemption-codes.vue` with the same admin layout style as `pages/admin/points/tasks.vue`. The page must include:

```vue
<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { House, Plus, Refresh, Tickets } from "@element-plus/icons-vue";

definePageMeta({
  layout: "admin",
  middleware: ["admin"],
});

const campaigns = ref([]);
const codes = ref([]);
const redemptions = ref([]);
const loading = ref(false);
const saving = ref(false);
const generating = ref(false);
const campaignDialogVisible = ref(false);
const generateDialogVisible = ref(false);
const generatedCodesDialogVisible = ref(false);
const editingCampaignId = ref(null);
const selectedCampaignId = ref(null);
const generatedCodes = ref([]);

const campaignForm = reactive({
  name: "",
  description: "",
  points: 100,
  rewardMode: "permanent",
  pointsExpiresInMinutes: 1440,
  enabled: true,
  startsAt: "",
  endsAt: "",
  maxRedemptionsPerUser: 1,
});

const generateForm = reactive({
  campaignId: null,
  quantity: 10,
  prefix: "AIPAN",
  batchName: "",
  maxRedemptions: 1,
  enabled: true,
});

const authHeaders = () => ({
  Authorization: `Bearer ${useCookie("token").value}`,
});

const stats = computed(() => ({
  campaigns: campaigns.value.length,
  enabledCampaigns: campaigns.value.filter((item) => item.enabled).length,
  codes: codes.value.length,
  redemptions: redemptions.value.length,
}));

const loadCampaigns = async () => {
  const res = await $fetch("/api/admin/points/redemption-codes/campaigns", {
    headers: authHeaders(),
  });
  campaigns.value = res.data || [];
};

const loadCodes = async () => {
  const res = await $fetch("/api/admin/points/redemption-codes/codes", {
    query: selectedCampaignId.value ? { campaignId: selectedCampaignId.value } : {},
    headers: authHeaders(),
  });
  codes.value = res.data || [];
};

const loadRedemptions = async () => {
  const res = await $fetch("/api/admin/points/redemption-codes/redemptions", {
    headers: authHeaders(),
  });
  redemptions.value = res.data || [];
};

const loadPageData = async () => {
  loading.value = true;
  try {
    await Promise.all([loadCampaigns(), loadCodes(), loadRedemptions()]);
  } finally {
    loading.value = false;
  }
};
</script>
```

Then implement the template sections in this order:

1. Header card with breadcrumbs, refresh button, create campaign button, generate codes button.
2. Four stat cards: campaigns, enabled campaigns, visible codes, redemptions.
3. Campaign table with edit and enable/disable actions.
4. Code table with masked code, campaign, batch, used count, status.
5. Redemption table with user, campaign, masked code, points, expiration, redeemed time.
6. Campaign dialog.
7. Generate-code dialog.
8. Generated-codes dialog containing a textarea with plaintext codes and the warning text `兑换码明文只显示这一次，请立即保存。`

- [ ] **Step 3: Add save and generate functions**

In the page script, add these functions:

```js
const openCreateCampaignDialog = () => {
  editingCampaignId.value = null;
  Object.assign(campaignForm, {
    name: "",
    description: "",
    points: 100,
    rewardMode: "permanent",
    pointsExpiresInMinutes: 1440,
    enabled: true,
    startsAt: "",
    endsAt: "",
    maxRedemptionsPerUser: 1,
  });
  campaignDialogVisible.value = true;
};

const openEditCampaignDialog = (campaign) => {
  editingCampaignId.value = campaign.id;
  Object.assign(campaignForm, {
    name: campaign.name,
    description: campaign.description || "",
    points: campaign.points,
    rewardMode: campaign.pointsExpiresInMinutes ? "temporary" : "permanent",
    pointsExpiresInMinutes: campaign.pointsExpiresInMinutes || 1440,
    enabled: campaign.enabled,
    startsAt: campaign.startsAt || "",
    endsAt: campaign.endsAt || "",
    maxRedemptionsPerUser: campaign.maxRedemptionsPerUser || 1,
  });
  campaignDialogVisible.value = true;
};

const saveCampaign = async () => {
  saving.value = true;
  try {
    const endpoint = editingCampaignId.value
      ? `/api/admin/points/redemption-codes/campaigns/${editingCampaignId.value}`
      : "/api/admin/points/redemption-codes/campaigns";
    const res = await $fetch(endpoint, {
      method: editingCampaignId.value ? "PUT" : "POST",
      body: campaignForm,
      headers: authHeaders(),
    });
    if (res.code === 200) {
      ElMessage.success(res.msg || "保存成功");
      campaignDialogVisible.value = false;
      await loadPageData();
    }
  } finally {
    saving.value = false;
  }
};

const openGenerateDialog = (campaign = null) => {
  Object.assign(generateForm, {
    campaignId: campaign?.id || selectedCampaignId.value || campaigns.value[0]?.id || null,
    quantity: 10,
    prefix: "AIPAN",
    batchName: "",
    maxRedemptions: 1,
    enabled: true,
  });
  generateDialogVisible.value = true;
};

const generateCodes = async () => {
  if (!generateForm.campaignId) {
    ElMessage.error("请选择兑换活动");
    return;
  }
  generating.value = true;
  try {
    const res = await $fetch(`/api/admin/points/redemption-codes/campaigns/${generateForm.campaignId}/codes`, {
      method: "POST",
      body: generateForm,
      headers: authHeaders(),
    });
    if (res.code === 200) {
      generatedCodes.value = res.data?.codes || [];
      generateDialogVisible.value = false;
      generatedCodesDialogVisible.value = true;
      await loadPageData();
    }
  } finally {
    generating.value = false;
  }
};
```

- [ ] **Step 4: Run build validation**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 5: Commit admin UI**

Run:

```bash
git add pages/admin/points/redemption-codes.vue layouts/admin.vue
git commit -m "feat: add redemption code admin UI"
```

Expected: local commit created.

---

### Task 7: User Center Redemption UI And Point Labels

**Files:**
- Create: `components/user/RedemptionCodeCard.vue`
- Modify: `pages/user/checkin.vue`
- Modify: `components/user/PointsOverview.vue`
- Modify: `server/api/user/points/history.get.ts`
- Modify: `server/api/admin/user-center/[id]/points.get.ts`
- Modify: `pages/admin/users/index.vue`

- [ ] **Step 1: Create user redemption card**

Create `components/user/RedemptionCodeCard.vue`:

```vue
<template>
  <article class="flex min-h-[220px] flex-col rounded-xl border border-gray-200 bg-white p-5 transition-colors duration-200 hover:border-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-700">
    <div class="flex items-start justify-between gap-4">
      <div class="flex min-w-0 items-start gap-4">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-xl text-amber-600 dark:bg-amber-900/30 dark:text-amber-200">
          <i class="fa-solid fa-ticket"></i>
        </div>
        <div class="min-w-0">
          <h3 class="m-0 text-base font-semibold leading-6 text-gray-950 dark:text-white">兑换码</h3>
          <p class="m-0 mt-1 max-w-[360px] text-sm leading-6 text-gray-500 dark:text-gray-400">
            输入管理员发放的兑换码，兑换后积分会立即计入账号。
          </p>
        </div>
      </div>
      <span class="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
        积分奖励
      </span>
    </div>

    <form class="mt-auto flex flex-col gap-3 pt-5" @submit.prevent="submit">
      <input
        v-model="code"
        class="min-h-10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
        type="text"
        autocomplete="off"
        placeholder="请输入兑换码"
        :disabled="redeeming"
      />
      <button
        class="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
        type="submit"
        :disabled="redeeming || !code.trim()"
      >
        <i :class="redeeming ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-gift'"></i>
        {{ redeeming ? '兑换中' : '兑换积分' }}
      </button>
    </form>
  </article>
</template>

<script setup>
import { ref } from "vue";

const emit = defineEmits(["redeemed"]);

const code = ref("");
const redeeming = ref(false);

const submit = async () => {
  if (!code.value.trim() || redeeming.value) return;
  redeeming.value = true;
  try {
    const response = await $fetch("/api/user/points/redemption-codes/redeem", {
      method: "POST",
      body: { code: code.value },
      headers: {
        Authorization: `Bearer ${useCookie("token").value}`,
      },
    });
    if (response.code === 200) {
      emit("redeemed", response.data);
      code.value = "";
    }
  } finally {
    redeeming.value = false;
  }
};
</script>
```

- [ ] **Step 2: Render the card in user center**

In `pages/user/checkin.vue`, add the import:

```js
import UserRedemptionCodeCard from '~/components/user/RedemptionCodeCard.vue'
```

In the task grid, render it after `UserCheckInCard`:

```vue
<UserRedemptionCodeCard @redeemed="handleRedemptionCodeRedeemed" />
```

Add this handler near `handleClaimPointTask`:

```js
const handleRedemptionCodeRedeemed = async (data) => {
  if (userStore.user) {
    userStore.user.points = data.totalPoints;
    userStore.user.permanentPoints = data.permanentPoints;
    userStore.user.temporaryPoints = data.temporaryPoints;
    userStore.user.effectivePoints = data.effectivePoints;
    userStore.user.nextExpiringAt = data.nextExpiringAt;
    userStore.user.pointsBreakdown = data.pointsBreakdown;
  }
  refreshAccessControlConfig().catch(error => {
    console.warn('Failed to refresh access control config after redemption code claim:', error)
  })
  ElMessage.success(`兑换成功，获得 ${data.points} 积分`)
  await handlePointsChanged()
};
```

Update `taskSummaryText` so redemption code counts as one available task:

```js
return `${2 + (transferTask.value.enabled ? 1 : 0) + pointTasks.value.length} 个可用任务`
```

- [ ] **Step 3: Add point type labels**

In each type map, add:

```js
redemption: '兑换码奖励'
```

For `components/user/PointsOverview.vue`, use double quotes to match the local style:

```js
redemption: "兑换码奖励",
```

For `pages/admin/users/index.vue`, also add a tag style:

```js
redemption: 'success'
```

- [ ] **Step 4: Run tests and build**

Run:

```bash
node --test tests/points/redemptionCodes.test.mjs tests/points/pointsLedger.test.mjs
npm run build
```

Expected: both PASS.

- [ ] **Step 5: Commit user UI**

Run:

```bash
git add components/user/RedemptionCodeCard.vue pages/user/checkin.vue components/user/PointsOverview.vue server/api/user/points/history.get.ts server/api/admin/user-center/[id]/points.get.ts pages/admin/users/index.vue
git commit -m "feat: add user redemption code UI"
```

Expected: local commit created.

---

### Task 8: Database Migration, Full Verification, And Handoff

**Files:**
- Modify generated Prisma client files if the repository workflow updates `generated/prisma`.
- Confirm all files changed by Tasks 1-7.

- [ ] **Step 1: Create and apply the Prisma migration**

Run the repository's Prisma migration flow:

```bash
npx prisma migrate dev --name add_redemption_codes
```

Expected: migration created and applied locally.

- [ ] **Step 2: Refresh generated Prisma client**

Run:

```bash
npx prisma generate
```

Expected: `generated/prisma` includes redemption code models.

- [ ] **Step 3: Run targeted tests**

Run:

```bash
node --test tests/points/redemptionCodes.test.mjs tests/points/pointTasks.test.mjs tests/points/pointsLedger.test.mjs
```

Expected: PASS.

- [ ] **Step 4: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 5: Run local app**

Run:

```bash
npm run dev
```

Expected: Nuxt dev server starts on port 3001.

- [ ] **Step 6: Browser verification path**

Use the local browser against `http://localhost:3001`:

1. Log in as an admin.
2. Open `/admin/points/redemption-codes`.
3. Create a campaign with `100` permanent points.
4. Generate one code.
5. Save the plaintext code shown in the dialog.
6. Log in as a normal user.
7. Open `/user/checkin`.
8. Redeem the code.
9. Confirm the points overview increases by `100`.
10. Open the point-history tab and confirm `兑换码奖励` appears.
11. Return to admin redemption records and confirm the redemption row appears.
12. Redeem the same code again and confirm duplicate redemption is rejected.

- [ ] **Step 7: Final git review**

Run:

```bash
git status --short
git diff --check
git log --oneline -5
```

Expected:

- No whitespace errors.
- Only intended redemption-code files changed.
- Recent commits show the feature broken into the task commits above.

- [ ] **Step 8: Final implementation commit if migration/generated files remained unstaged**

Run:

```bash
git add prisma generated .env.example .env.production.example server pages components layouts tests
git commit -m "feat: complete redemption code workflow"
```

Expected: commit created only if Step 7 shows remaining intended changes.

---

## Self-Review

Spec coverage:

- Admin configurable campaigns and code generation are covered by Tasks 1, 5, and 6.
- User redemption is covered by Tasks 3, 4, and 7.
- Existing point ledger integration is covered by Tasks 1, 3, and 7.
- Security controls are covered by Tasks 2, 3, 4, and 5.
- Verification and rollout are covered by Task 8.

Type consistency:

- Point type is consistently `redemption`.
- Campaign model is consistently `RedemptionCodeCampaign`.
- Code model is consistently `RedemptionCode`.
- Redemption record model is consistently `RedemptionCodeRedemption`.
- Service file is consistently `server/services/points/redemptionCodes.mjs` to match existing Node test import patterns.
