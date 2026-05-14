# Daily Redemption Drops Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a configurable daily points claim pool that redirects forum "求兑换码" demand into a fair daily claim flow.

**Architecture:** Store recurring drop rules in `DailyRedemptionDrop` and per-user daily claims in `DailyRedemptionDropClaim`. Claiming is handled by a points service with transactional quota checks and existing `PointsHistory` semantics. UI surfaces live in admin points settings, user points center, and the forum sidebar.

**Tech Stack:** Nuxt 4, Nitro server API routes, Prisma PostgreSQL, Element Plus, Node test runner.

---

### Task 1: Core Contract Tests

**Files:**
- Create: `tests/points/dailyRedemptionDrops.test.mjs`
- Create: `tests/forum/dailyRedemptionDropContract.test.mjs`

- [ ] Write service tests for config normalization, local date windows, release-time status, eligibility, and transactional claim behavior.
- [ ] Write UI/API contract tests that check new files and labels exist.
- [ ] Run `node --test tests/points/dailyRedemptionDrops.test.mjs tests/forum/dailyRedemptionDropContract.test.mjs` and verify the new tests fail before implementation.

### Task 2: Schema And Service

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260514090000_add_daily_redemption_drops/migration.sql`
- Create: `server/services/points/dailyRedemptionDrops.mjs`
- Modify: `server/services/points/pointsLedger.mjs`

- [ ] Add `DailyRedemptionDrop` and `DailyRedemptionDropClaim` models and relations.
- [ ] Add the `daily_redemption_drop` points type.
- [ ] Implement config normalization, Asia/Shanghai date helpers, status resolution, and transactional claim logic.
- [ ] Run the new service tests and verify they pass.

### Task 3: APIs

**Files:**
- Create: `server/api/admin/points/daily-redemption-drop.ts`
- Create: `server/api/user/points/daily-redemption-drop/status.get.ts`
- Create: `server/api/user/points/daily-redemption-drop/claim.post.ts`
- Modify: `server/api/user/points/index.get.ts`
- Modify: `server/api/user/points/history.get.ts`

- [ ] Add admin read/save endpoint.
- [ ] Add user status and claim endpoints.
- [ ] Include daily drop status in points summary.
- [ ] Add type-name mapping for daily drop point records.

### Task 4: UI Surfaces

**Files:**
- Create: `components/user/DailyRedemptionDropCard.vue`
- Create: `pages/admin/points/daily-redemption-drop.vue`
- Modify: `pages/user/checkin.vue`
- Modify: `pages/forum/index.vue`
- Modify: `layouts/admin.vue`

- [ ] Add user claim card to points center.
- [ ] Add forum sidebar guidance and claim status card.
- [ ] Add admin config page and sidebar entry.
- [ ] Keep layouts compact and consistent with existing forum/admin styles.

### Task 5: Verification

**Commands:**
- `npx prisma generate`
- `npx prisma validate`
- `node --test tests/points/dailyRedemptionDrops.test.mjs tests/points/redemptionCodes.test.mjs tests/points/pointTasks.test.mjs tests/points/pointsLedger.test.mjs tests/forum/dailyRedemptionDropContract.test.mjs`
- `npm run build`
- `git diff --check`

- [ ] Apply and validate Prisma generation.
- [ ] Run targeted tests.
- [ ] Build the app.
- [ ] Run a local browser smoke test for admin, forum, and points-center surfaces.
