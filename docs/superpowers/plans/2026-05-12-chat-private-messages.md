# Chat Private Messages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild chat into an inbox-oriented experience and add forum-triggered private messaging gated by a 10000 effective-points eligibility rule without deducting points.

**Architecture:** Keep `ChatRoom`, `ChatRoomUser`, and `ChatMessage` as the source of truth, and add private conversation metadata plus read tracking. Put eligibility and room creation in dedicated services, expose a thin `/api/chat/private/start` endpoint, harden generic room creation so it cannot bypass the rule, then connect forum author actions and `/chat?roomId=` routing to the new API.

**Tech Stack:** Nuxt 4, H3 server routes, Prisma/PostgreSQL, Socket.IO, Pinia, Element Plus, Node test runner.

---

## File Structure

- Modify `prisma/schema.prisma`
  - Add `ChatRoom.privateKey`, `ChatRoom.lastMessageAt`, and `ChatRoom.sourceForumTopicId`.
  - Add `ChatRoomUser.lastReadAt`.
  - Add relation from `PointsHistory` to chat room is not needed because no points are deducted.
- Create `prisma/migrations/20260512110000_add_private_message_metadata/migration.sql`
  - Add nullable columns and indexes.
- Create `server/services/points/privateMessageEligibility.mjs`
  - Normalize the private-message threshold config and decide whether a user can start a new private room.
- Create `server/services/chat/privateConversations.mjs`
  - Build pair keys, find or create one-to-one private rooms, create optional first messages, and create recipient notifications.
- Create `server/api/chat/private/start.post.ts`
  - Authenticated private-conversation start endpoint.
- Modify `server/api/chat/rooms/index.post.ts`
  - Reject direct normal-user private-room creation.
- Modify `server/api/chat/rooms/index.get.ts`
  - Return richer inbox rows: recipient info, last message preview, unread count, and display name.
- Modify `server/api/chat/rooms/[id]/messages.get.ts`
  - Update `ChatRoomUser.lastReadAt` for the current user.
- Modify `server/api/chat/messages/index.post.ts`
  - Keep message sending free for existing rooms, update `lastMessageAt`, and create private-message notifications.
- Modify `server/plugins/socket.ts`
  - Keep room-based `send_message`; stop using the socket-only private-room creation path.
- Create `server/api/admin/points/private-message.ts`
  - Admin config endpoint for the 10000 threshold.
- Modify `pages/admin/points/tasks.vue`
  - Add private-message eligibility card and settings form.
- Create `components/chat/PrivateMessageStartDialog.vue`
  - Reusable forum modal for starting a private conversation.
- Modify `components/ForumPostItem.vue`
  - Add a private-message action for reply authors.
- Modify `pages/forum/topic/[slug].vue`
  - Add a private-message action for topic authors and wire the reusable dialog.
- Modify `pages/chat/index.vue`
  - Rebuild into inbox view with tabs, `/chat?roomId=` auto-select, richer empty states, and mobile-friendly list/detail behavior.
- Modify `components/chat/ChatRoom.vue`
  - Fit the inbox view, mark read on fetch, and refresh parent room list after sending.
- Modify `components/chat/ChatMessage.vue`
  - Tighten message bubble layout for the new chat page.
- Create tests:
  - `tests/points/privateMessageEligibility.test.mjs`
  - `tests/chat/privateConversations.test.mjs`
  - `tests/chat/privateMessageContracts.test.mjs`
  - `tests/forum/privateMessageEntryContract.test.mjs`

---

### Task 1: Points Eligibility Service

**Files:**
- Create: `tests/points/privateMessageEligibility.test.mjs`
- Create: `server/services/points/privateMessageEligibility.mjs`

- [ ] **Step 1: Write failing tests**

Create tests covering default threshold, admin bypass, effective-points eligibility, and config normalization:

```js
import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_PRIVATE_MESSAGE_MINIMUM_POINTS,
  normalizePrivateMessageConfig,
  resolvePrivateMessageStartEligibility,
} from "../../server/services/points/privateMessageEligibility.mjs";

test("private message config defaults to a 10000 point threshold", () => {
  assert.equal(DEFAULT_PRIVATE_MESSAGE_MINIMUM_POINTS, 10000);
  assert.deepEqual(normalizePrivateMessageConfig({}), {
    privateMessageMinimumPoints: 10000,
    adminBypass: true,
  });
});

test("private message eligibility uses effective points without spending them", () => {
  assert.deepEqual(resolvePrivateMessageStartEligibility({
    user: { role: "user" },
    pointsBreakdown: { effectivePoints: 9999 },
    config: {},
  }), {
    allowed: false,
    reason: "insufficient_points",
    requiredPoints: 10000,
    currentPoints: 9999,
    message: "发起私信需要当前积分达到 10000，回复已有私信不受限制。",
  });

  assert.equal(resolvePrivateMessageStartEligibility({
    user: { role: "user" },
    pointsBreakdown: { effectivePoints: 10000 },
    config: {},
  }).allowed, true);
});

test("admin bypass allows support users to start private messages", () => {
  assert.equal(resolvePrivateMessageStartEligibility({
    user: { role: "admin" },
    pointsBreakdown: { effectivePoints: 0 },
    config: {},
  }).allowed, true);
});
```

- [ ] **Step 2: Run test to verify RED**

Run: `node --test tests/points/privateMessageEligibility.test.mjs`
Expected: FAIL because the service file does not exist.

- [ ] **Step 3: Implement service**

Export constants and pure helpers from `privateMessageEligibility.mjs`.

- [ ] **Step 4: Run test to verify GREEN**

Run: `node --test tests/points/privateMessageEligibility.test.mjs`
Expected: PASS.

### Task 2: Private Conversation Service

**Files:**
- Create: `tests/chat/privateConversations.test.mjs`
- Create: `server/services/chat/privateConversations.mjs`

- [ ] **Step 1: Write failing tests**

Test pure helpers for sorted pair keys, recipient validation, existing-room short-circuit, insufficient-points rejection, and no point deduction in create flow using a fake Prisma client.

- [ ] **Step 2: Run test to verify RED**

Run: `node --test tests/chat/privateConversations.test.mjs`
Expected: FAIL because the service file does not exist.

- [ ] **Step 3: Implement service**

Implement `buildPrivateRoomKey()`, `createPrivateRoomName()`, `toPrivateRoomPayload()`, and `startPrivateConversation()`.

- [ ] **Step 4: Run test to verify GREEN**

Run: `node --test tests/chat/privateConversations.test.mjs`
Expected: PASS.

### Task 3: Schema And API Contracts

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260512110000_add_private_message_metadata/migration.sql`
- Create: `tests/chat/privateMessageContracts.test.mjs`
- Create: `server/api/chat/private/start.post.ts`
- Modify: `server/api/chat/rooms/index.post.ts`
- Modify: `server/api/chat/rooms/index.get.ts`
- Modify: `server/api/chat/rooms/[id]/messages.get.ts`
- Modify: `server/api/chat/messages/index.post.ts`
- Modify: `server/plugins/socket.ts`

- [ ] **Step 1: Write failing contract tests**

Static contract tests should assert the schema fields exist, the start endpoint imports `startPrivateConversation`, direct private room creation is rejected, messages update `lastMessageAt`, and socket `private_message` no longer creates private rooms directly.

- [ ] **Step 2: Run test to verify RED**

Run: `node --test tests/chat/privateMessageContracts.test.mjs`
Expected: FAIL on missing schema fields and endpoint.

- [ ] **Step 3: Implement schema, endpoints, and socket cleanup**

Add migration, update Prisma schema, implement the start endpoint, harden direct room creation, and enrich room/message endpoints.

- [ ] **Step 4: Run test to verify GREEN**

Run: `node --test tests/chat/privateMessageContracts.test.mjs`
Expected: PASS.

### Task 4: Admin Config

**Files:**
- Create: `server/api/admin/points/private-message.ts`
- Modify: `pages/admin/points/tasks.vue`

- [ ] **Step 1: Add config endpoint**

Use `SystemSettings` key `chat_private_message_config`; GET returns normalized config, POST saves normalized config.

- [ ] **Step 2: Add admin UI**

Add a card/form in the points task page for private-message eligibility threshold and admin bypass.

- [ ] **Step 3: Verify**

Run: `rg -n "chat_private_message_config|privateMessageMinimumPoints|私信" server/api/admin/points/private-message.ts pages/admin/points/tasks.vue`
Expected: all config surfaces are present.

### Task 5: Forum Entry And Chat UI

**Files:**
- Create: `tests/forum/privateMessageEntryContract.test.mjs`
- Create: `components/chat/PrivateMessageStartDialog.vue`
- Modify: `components/ForumPostItem.vue`
- Modify: `pages/forum/topic/[slug].vue`
- Modify: `pages/chat/index.vue`
- Modify: `components/chat/ChatRoom.vue`
- Modify: `components/chat/ChatMessage.vue`

- [ ] **Step 1: Write failing frontend contract test**

Static contract test should assert the forum action imports the dialog, emits recipient data, the dialog calls `/api/chat/private/start`, and `/chat` reads `route.query.roomId`.

- [ ] **Step 2: Run test to verify RED**

Run: `node --test tests/forum/privateMessageEntryContract.test.mjs`
Expected: FAIL because the dialog does not exist and chat route query support is missing.

- [ ] **Step 3: Implement forum private-message entry**

Add the dialog and wire topic/reply author buttons.

- [ ] **Step 4: Rebuild chat page**

Implement inbox tabs, auto-select by `roomId`, room list refresh, and concise message layout.

- [ ] **Step 5: Run test to verify GREEN**

Run: `node --test tests/forum/privateMessageEntryContract.test.mjs`
Expected: PASS.

### Task 6: Verification

**Files:**
- All changed files.

- [ ] **Step 1: Run focused tests**

Run:

```bash
node --test tests/points/privateMessageEligibility.test.mjs tests/chat/privateConversations.test.mjs tests/chat/privateMessageContracts.test.mjs tests/forum/privateMessageEntryContract.test.mjs
```

Expected: PASS.

- [ ] **Step 2: Run existing affected tests**

Run:

```bash
node --test tests/points/pointsLedger.test.mjs tests/points/pointTasks.test.mjs tests/forum/v2LayoutContract.test.mjs tests/forum/unreadRealtimeContract.test.mjs
```

Expected: PASS.

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Browser verify**

Start local dev server with `npm run dev` and verify `/forum`, a forum topic page, and `/chat`.

## Self-Review

- Spec coverage: backend eligibility, no deduction, existing-room free replies, forum entry, chat rebuild, notification center, and duplicate-room prevention are covered.
- Placeholder scan: no TBD/TODO placeholders.
- Type consistency: service names and endpoint names match the file structure above.
