# Daily Redemption Drops Design

## Goal

Reduce repeated "求兑换码" forum posts by giving users a clear daily place to claim limited point rewards.

## Product Shape

The feature is a daily claim pool, not public plaintext codes. Users see a forum and points-center card with today's status, release time, remaining quota, and a claim button. At release time, logged-in users claim directly; points are granted to the account and the action is recorded.

Admins configure daily drop rules in the points admin area:

- enabled or paused
- name and description
- release time in Asia/Shanghai, stored as `HH:mm`
- daily quota
- points per claim
- permanent or temporary points
- per-user daily limit
- email verification requirement
- minimum account age in days

## Data Model

`DailyRedemptionDrop` stores the recurring rule. It is intentionally separate from `RedemptionCodeCampaign` because users do not receive or redeem plaintext codes.

`DailyRedemptionDropClaim` stores one user claim for one local date. It has a unique constraint on `(dropId, userId, claimDate, claimNo)` and a relation to `PointsHistory`.

`claimDate` is stored as a `DateTime @db.Date` for the Asia/Shanghai local date. All daily-window checks use Asia/Shanghai.

## Claim Rules

A user can claim only when:

- the drop is enabled
- today's local time is at or after the configured release time
- the account is active and not an admin
- email verification is satisfied when required
- account age meets the configured minimum
- today's total claims are below the daily quota
- the user's claims for the day are below the per-user limit

Claiming is transactional. The transaction creates the claim row, writes `PointsHistory`, updates permanent `User.points` only for permanent rewards, and returns the refreshed points breakdown. Quota is checked inside the transaction and uniqueness protects duplicate claims.

## Surfaces

User APIs:

- `GET /api/user/points/daily-redemption-drop/status`
- `POST /api/user/points/daily-redemption-drop/claim`

Admin API:

- `GET/POST /api/admin/points/daily-redemption-drop`

UI:

- points center card in `pages/user/checkin.vue`
- forum sidebar card in `pages/forum/index.vue`
- admin configuration page at `/admin/points/daily-redemption-drop`

## Rollout

The default config is disabled until an admin enables it. This prevents accidental production giveaways after migration. Once enabled, the API can lazily create status for the current local day without relying on a separate cron job.

## Testing

Service tests cover normalization, release-time state, quota exhaustion, duplicate claim blocking, temporary and permanent point grants, account eligibility, and Asia/Shanghai local dates. Contract tests cover the new API/UI surfaces and forum redirect wording.
