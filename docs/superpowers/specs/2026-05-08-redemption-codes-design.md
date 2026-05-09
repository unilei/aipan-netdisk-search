# Redemption Codes Design

## Goal

Add a complete redemption-code feature for Aipan where admins can configure redeemable point rewards in the admin panel, and logged-in users can redeem codes from the user center.

The feature must integrate with the existing points ledger instead of creating a separate balance system. Redeemed points must appear in user point totals, point history, admin user detail pages, and existing access-control calculations.

## Existing Project Context

The project already has a points system built around these pieces:

- `User.points` stores permanent points.
- `PointsHistory` stores every point change.
- Temporary points are represented by positive `PointsHistory` records with `expiresAt`.
- `getUserPointsBreakdown()` calculates effective points as permanent points plus active temporary records.
- User-facing point acquisition lives in `pages/user/checkin.vue`.
- Admin point-task management lives in `pages/admin/points/tasks.vue`.
- Existing point types are defined through `POINT_TYPES` in `server/services/points/pointsLedger.mjs`.

The redemption-code feature should follow these patterns:

- Permanent rewards update `User.points` and write `PointsHistory`.
- Temporary rewards write `PointsHistory.expiresAt` and do not update `User.points`.
- All grants happen inside a database transaction.
- UI updates should refresh the same points overview and point-history flows already used by check-in and task rewards.

## Product Scope

### V1 Included

- Admin creates redemption campaigns.
- Admin generates batches of redemption codes under a campaign.
- Admin can enable, disable, inspect, and export newly generated code plaintext once.
- Admin can view redemption records.
- User redeems a code in the user center.
- Codes can grant permanent points or temporary points.
- Codes can have global usage limits and per-user limits.
- Code redemption is fully auditable through `PointsHistory` and a dedicated redemption record.

### V1 Excluded

- Non-point rewards such as membership, coupons, resources, or physical benefits.
- Public guest redemption.
- User-to-user transfer of codes.
- Re-showing plaintext codes after creation.
- Campaign-level marketing pages.

The schema should leave room for later reward types, but V1 should only implement point rewards.

## Recommended Architecture

Use an independent redemption-code domain, not `SystemSettings`.

Redemption codes need uniqueness, usage limits, audit trails, export behavior, and concurrent redemption safety. Dedicated tables keep this feature queryable and avoid mixing operational records into general settings.

### New Domain Files

- `server/services/points/redemptionCodes.ts`
  - Normalizes user input codes.
  - Generates random codes.
  - Hashes codes with a server secret.
  - Validates campaign and code eligibility.
  - Executes redemption transactions.
  - Shapes admin and user response payloads.

- `server/api/user/points/redemption-codes/redeem.post.ts`
  - User redemption endpoint.

- `server/api/admin/points/redemption-codes/campaigns/index.get.ts`
  - Admin campaign list.

- `server/api/admin/points/redemption-codes/campaigns/index.post.ts`
  - Admin campaign creation.

- `server/api/admin/points/redemption-codes/campaigns/[id].put.ts`
  - Admin campaign update.

- `server/api/admin/points/redemption-codes/campaigns/[id]/codes.post.ts`
  - Admin batch code generation.

- `server/api/admin/points/redemption-codes/codes/index.get.ts`
  - Admin code list.

- `server/api/admin/points/redemption-codes/redemptions/index.get.ts`
  - Admin redemption record list.

- `pages/admin/points/redemption-codes.vue`
  - Admin management UI.

- `components/user/RedemptionCodeCard.vue`
  - User-center redemption card.

This keeps the new business logic in a focused service while leaving the existing points pages responsible for presentation.

## Data Model

### `RedemptionCodeCampaign`

Represents a configurable redemption activity.

Fields:

- `id`
- `name`
- `description`
- `rewardType`, V1 value: `points`
- `points`
- `pointsExpiresInMinutes`, nullable. Null means permanent points.
- `enabled`
- `startsAt`, nullable
- `endsAt`, nullable
- `maxRedemptionsPerUser`
- `createdById`
- `createdAt`
- `updatedAt`

Important indexes:

- `enabled`
- `startsAt`
- `endsAt`
- `createdAt`

### `RedemptionCode`

Represents one redeemable code.

Fields:

- `id`
- `campaignId`
- `codeHash`, unique
- `codePrefix`, short display-only prefix
- `codeSuffix`, short display-only suffix
- `batchName`, nullable
- `maxRedemptions`
- `usedCount`
- `enabled`
- `createdAt`
- `updatedAt`

Important constraints and indexes:

- Unique `codeHash`
- Index `campaignId`
- Index `enabled`
- Index `batchName`
- Index `createdAt`

Plaintext code must not be stored after generation.

### `RedemptionCodeRedemption`

Represents one successful user redemption.

Fields:

- `id`
- `userId`
- `campaignId`
- `codeId`
- `points`
- `expiresAt`, nullable
- `pointsHistoryId`, unique nullable
- `ipHash`, nullable
- `userAgentHash`, nullable
- `createdAt`

Important constraints and indexes:

- Unique `(userId, codeId)` for one redemption per user per code.
- Index `userId`
- Index `campaignId`
- Index `codeId`
- Index `createdAt`

If a campaign allows more than one redemption per user across multiple different codes, the per-campaign limit is enforced by counting `RedemptionCodeRedemption` rows for `(userId, campaignId)`.

## Code Format And Storage

Generated codes should use uppercase alphanumeric chunks, for example:

`AIPAN-7K4M-9Q2X-H8FD`

Normalization rules:

- Trim surrounding whitespace.
- Convert to uppercase.
- Remove spaces.
- Preserve or remove hyphens consistently before hashing. Recommended canonical form: remove hyphens.

Hashing:

- Store `sha256(REDEMPTION_CODE_HASH_SECRET + ":" + canonicalCode)`.
- Add `REDEMPTION_CODE_HASH_SECRET` to `.env.example`, `.env.production.example`, and deploy docs.
- If the secret is missing in production, code generation and redemption must fail closed.

Admin code lists show masked values only, for example:

`AIPAN...H8FD`

Plaintext codes are returned only in the generation response for immediate export.

## Redemption Flow

User submits a code from the user center.

Server flow:

1. Require logged-in user from existing auth middleware.
2. Rate-limit by user id and client IP.
3. Normalize code.
4. Hash normalized code.
5. Start a Prisma transaction.
6. Find `RedemptionCode` by `codeHash` and include its campaign.
7. Validate:
   - Code exists.
   - Code is enabled.
   - Campaign is enabled.
   - `startsAt` is null or in the past.
   - `endsAt` is null or in the future.
   - `usedCount < maxRedemptions`.
   - User has not redeemed this code.
   - User has not exceeded campaign per-user limit.
8. Atomically increment `RedemptionCode.usedCount` with a guard condition so concurrent requests cannot overspend the code.
9. Create a `PointsHistory` row with type `redemption`.
10. If permanent reward, increment `User.points`.
11. Create `RedemptionCodeRedemption` linked to `PointsHistory`.
12. Recalculate points with `getUserPointsBreakdown()`.
13. Return latest point totals and the reward details.

User-visible error messages should be intentionally broad:

- `兑换码无效或不可用`
- `该兑换码已被兑换`
- `该活动已达到兑换上限`
- `请求过于频繁，请稍后再试`

Detailed failure reasons should be logged server-side for admin/debugging.

## Admin Behavior

### Campaign List

Admin can see:

- Campaign name and status.
- Reward points.
- Permanent or temporary reward.
- Validity window.
- Code count.
- Redemption count.
- Created time.

### Campaign Create/Edit

Fields:

- Name, required, max 80 chars.
- Description, optional, max 300 chars.
- Points, integer from 1 to 100000000.
- Reward validity:
  - Permanent points.
  - Temporary points with duration from 1 minute to 525600 minutes.
- Campaign enabled switch.
- Optional start/end time.
- Per-user campaign redemption limit.

If a campaign already has redemption records:

- Allow changing name, description, enabled, and end time.
- Do not allow changing points or temporary/permanent mode.

This preserves audit correctness because historical grants remain explainable.

### Code Generation

Admin inputs:

- Campaign.
- Quantity.
- Optional batch name.
- Optional code prefix.
- Max redemptions per code.
- Enabled state.

Recommended V1 limit:

- Maximum 1000 codes per batch.

Response:

- Generated plaintext code list for immediate export.
- Created count.
- Batch name.

The UI should warn that plaintext codes are shown only once.

### Redemption Records

Admin can filter by:

- Campaign.
- User keyword.
- Code suffix.
- Date range.

Each row shows:

- User.
- Campaign.
- Masked code.
- Points.
- Permanent or temporary.
- Expiration time.
- Redeemed time.

## User Center Behavior

Add a redemption card to the existing `pages/user/checkin.vue` "获取积分" section.

Card behavior:

- Shows a single input and redeem button.
- Disables submit while request is in flight.
- On success, shows granted points and whether they are permanent or temporary.
- Refreshes:
  - `UserPointsOverview`
  - point history if the active tab is point history
  - leaderboard if the active tab is leaderboard
  - access-control config through the existing refresh path
  - user store point fields

Add `redemption` to point type labels in:

- `components/user/PointsOverview.vue`
- `pages/user/checkin.vue`
- `server/api/user/points/history.get.ts`
- `server/api/admin/user-center/[id]/points.get.ts`
- `pages/admin/users/index.vue`

## API Response Contract

Successful user redemption:

```json
{
  "code": 200,
  "msg": "兑换成功",
  "data": {
    "granted": true,
    "points": 500,
    "isTemporary": false,
    "expiresAt": null,
    "totalPoints": 1280,
    "permanentPoints": 1280,
    "temporaryPoints": 0,
    "effectivePoints": 1280,
    "nextExpiringAt": null,
    "pointsBreakdown": {
      "permanentPoints": 1280,
      "temporaryPoints": 0,
      "effectivePoints": 1280,
      "nextExpiringAt": null
    }
  }
}
```

Failed user redemption:

```json
{
  "statusCode": 400,
  "statusMessage": "兑换码无效或不可用"
}
```

## Security And Abuse Controls

- Hash codes with a server secret.
- Do not persist plaintext codes.
- Add user/IP rate limiting on the redeem endpoint.
- Return broad user-facing errors to reduce code enumeration.
- Use database constraints for duplicate prevention.
- Use guarded updates for `usedCount` to prevent concurrent overspend.
- Keep all successful redemptions in `RedemptionCodeRedemption`.
- Keep all point grants in `PointsHistory`.
- Include `ipHash` and `userAgentHash` for abuse investigation without storing raw sensitive request data.

## Testing Plan

Unit tests:

- Code normalization accepts common human input variations.
- Code hashing is deterministic with the same secret.
- Code generation creates unique, readable codes.
- Campaign validation rejects disabled, expired, not-started, and exhausted campaigns.
- Redemption decision rejects duplicate user/code redemption.
- Temporary rewards produce `expiresAt`.
- Permanent rewards increment permanent points.

API/service tests:

- Successful permanent redemption creates `PointsHistory`, redemption record, and increments `User.points`.
- Successful temporary redemption creates `PointsHistory.expiresAt` and does not increment `User.points`.
- Duplicate redemption returns a conflict-style error.
- Concurrent redemption cannot exceed code `maxRedemptions`.
- Admin cannot change reward amount after redemptions exist.

UI verification:

- Admin creates a campaign.
- Admin generates codes and sees plaintext once.
- User redeems a code from the user center.
- Points overview refreshes immediately.
- Point history shows `兑换码奖励`.
- Admin redemption record appears.

Recommended commands:

- `node --test tests/points/*.test.mjs`
- `npm run build`

## Rollout Notes

Deployment needs:

- Prisma migration for the new tables and relations.
- Generated Prisma client refresh if required by the project workflow.
- `REDEMPTION_CODE_HASH_SECRET` configured in local, production, and deployment templates.

Backfill is not required because this is a new feature.

## Fixed V1 Decisions

These decisions are fixed for V1:

- Logged-in users only.
- Point rewards only.
- Plaintext codes are shown only once at generation time.
- Existing redeemed rewards remain immutable through audit records.
