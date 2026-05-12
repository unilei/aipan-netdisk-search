# Chat Page Rebuild and Private Messaging Design

## Context

AIPAN already has a chat data model built around `ChatRoom`, `ChatRoomUser`, and `ChatMessage`, and the forum already exposes topic authors and reply authors. The current chat page behaves more like a generic room manager than a private-message inbox. Private chat rooms can also be created through the general room creation path, which means product rules such as private-message eligibility are not enforced in one clear place.

The new design rebuilds `/chat` as a conversation center and adds private messaging from the forum. The key business rule is:

- A user must have at least 10000 effective points to actively start a new private conversation.
- Starting a private conversation does not deduct points.
- Replying in an existing private conversation is always free.

## Goals

- Let logged-in users send private messages to forum users from topic and reply surfaces.
- Rebuild `/chat` into a focused inbox experience for private conversations, group chats, and public rooms.
- Enforce the 10000-point eligibility rule on the server, not only in the UI.
- Preserve the existing chat room/message foundation instead of creating a parallel private-message system.
- Keep private-message replies free once a conversation already exists.
- Create notification-center records for received private messages so the recipient has a durable in-site record.

## Non-Goals

- No paid deduction or points spending for private messages.
- No email delivery for private messages in the initial version.
- No end-to-end encryption in this iteration.
- No blocklist, mute, or report expansion beyond reusing the existing report surface where practical.
- No full replacement of group/public chat behavior beyond the changes needed to keep private-message rules consistent.

## Product Rules

### Eligibility

The private-message start rule applies only when creating a new one-to-one private room. The server first checks whether the sender and recipient already have an existing private room.

- Existing private room found: return it immediately, no points check.
- Existing private room not found: require sender effective points >= 10000.
- Sender below 10000 effective points: reject with a clear 403 response.
- Sender has at least 10000 effective points: create the private room, no points deduction.

Effective points should match what the user sees in the points center: permanent points plus active temporary points. This keeps the rule understandable to users. If the product later wants a reputation-style requirement, it can switch to permanent points through the same eligibility service.

Admins should bypass the eligibility threshold so support and moderation workflows are not blocked.

### Conversation Identity

Each pair of users should have only one private conversation. The room should store a stable pair key based on sorted user IDs, for example `12:48`. That key prevents duplicate private rooms and makes forum entry, chat entry, and future notification entry all converge on the same conversation.

### Free Replies

Replies are free because message sending checks membership in an existing room, not the sender's points balance. A user who has an existing private room can keep sending messages in that room even if their points later fall below 10000.

## Architecture

### Backend Services

Add a dedicated service module:

`server/services/chat/privateConversations.ts`

Responsibilities:

- Normalize and validate sender/recipient IDs.
- Reject self-message attempts.
- Verify the recipient exists and is active.
- Build the private pair key.
- Find an existing private room by pair key.
- Check effective points only when no room exists.
- Create the private room and both room memberships inside one transaction.
- Optionally create the first message inside the same transaction.
- Return a consistent room payload for the frontend.

This service becomes the only supported path for starting private conversations.

### API Endpoints

Add:

`POST /api/chat/private/start`

Request body:

```json
{
  "recipientId": 48,
  "content": "你好，我想私信交流一下这个帖子。"
}
```

Behavior:

- Requires login.
- Returns existing private room if it exists.
- If no room exists, checks eligibility and creates the private room.
- If `content` is present and non-empty, creates the first message after the room exists.
- Emits socket events to the sender and recipient when possible.
- Creates a notification-center record for the recipient when a message is sent.

Response:

```json
{
  "success": true,
  "data": {
    "room": {
      "id": 123,
      "type": "private",
      "displayName": "recipient_username",
      "recipient": {
        "id": 48,
        "username": "recipient_username",
        "avatarStyle": "avataaars"
      }
    },
    "created": true,
    "message": {
      "id": 456
    }
  }
}
```

If the user lacks enough points:

```json
{
  "success": false,
  "message": "发起私信需要当前积分达到 10000，回复已有私信不受限制。",
  "requiredPoints": 10000,
  "currentPoints": 8200
}
```

Update:

`POST /api/chat/rooms`

This endpoint should stop accepting normal-user `type = private` creation. Private rooms must go through `/api/chat/private/start`. Group and public room creation can continue here.

Update:

`POST /api/chat/messages`

This endpoint remains the canonical message creation path. It should allow members to send messages in existing private rooms without checking points. It should also create recipient notifications for private messages when the sender is not the recipient.

Update socket handling:

- Keep `send_message` as the realtime wrapper over `POST /api/chat/messages`.
- Remove or deprecate the socket-only `private_message` creation path because it tries to create private rooms separately and cannot enforce the pair-key and eligibility rules consistently.

### Data Model

Extend `ChatRoom` with private-room metadata:

- `privateKey String? @unique`
- `lastMessageAt DateTime?`

Extend `ChatRoomUser` with read tracking:

- `lastReadAt DateTime?`

Indexes:

- `ChatRoom.privateKey` unique for one-to-one private rooms.
- `ChatRoom.updatedAt` or `lastMessageAt` for inbox sorting.
- `ChatRoomUser.userId, roomId` already exists and should remain the membership boundary.

The existing `ChatMessage.isRead` field can remain for compatibility, but the inbox unread count should use member-level `lastReadAt` because one message can have different read states for different members.

### Points

Add a small eligibility helper:

`server/services/points/privateMessageEligibility.ts`

Responsibilities:

- Read effective points through the existing points breakdown logic.
- Apply the default threshold of 10000.
- Allow admin bypass.
- Return structured data for UI messages.

The threshold should be configurable through `SystemSettings` using a separate key such as:

`chat_private_message_config`

Default config:

```json
{
  "privateMessageMinimumPoints": 10000,
  "adminBypass": true
}
```

The admin UI location should be the existing points-task area, because this is a points-related product rule and prior admin settings have already moved in that direction.

## Frontend Design

### Chat Page

Rebuild `/chat` as an inbox-style page.

Left column:

- Tabs: 私信, 群聊, 公开
- Search by username or room name
- Conversation rows with avatar, display name, last message, time, unread count
- Empty state for each tab

Main panel:

- Conversation header with recipient or room name
- Message stream with date dividers
- Reply quote support
- Send box
- Loading and failure states

Right panel on desktop:

- Private conversation: recipient profile summary, link back to relevant forum source when available
- Group/public room: member list and room metadata

Mobile:

- Start with the conversation list
- Selecting a conversation opens the message panel
- Back button returns to list

### Forum Entry

Add a `私信` action near forum author surfaces:

- Topic author card
- Reply item footer next to `回复`

Behavior:

- If not logged in: redirect to login with return path.
- If messaging self: hide the button or show disabled text.
- If existing private room: open `/chat?roomId=<id>`.
- If no existing private room and user has enough points: show composer modal and then start the conversation.
- If no existing private room and user is below threshold: show the points requirement with current points and a link to points center/check-in.

The modal copy must make clear that 10000 is an eligibility requirement, not a fee:

`发起新私信需要当前积分达到 10000。不会扣除积分，已有私信回复不受限制。`

## Notifications

When a private message is sent, create a `Notification` for the recipient:

- `type`: `private_message`
- `title`: `收到新的私信`
- `content`: sender username plus a short preview
- `relatedId`: room ID

Socket event:

- Emit `notification:new` to `user:<recipientId>`.
- Emit chat room updates to both conversation members.

This keeps the notification center as the durable source of truth. Realtime events are only delivery acceleration.

## Error Handling

Server responses should distinguish these cases:

- `401`: login required
- `400`: invalid recipient, empty first message when required, self-message
- `403`: insufficient points to start a new private conversation
- `404`: recipient not found or disabled
- `409`: duplicate creation race resolved by returning the existing room when possible

Duplicate room creation must be race-safe. The service should use a transaction plus the unique `privateKey`; if a unique conflict occurs, it should fetch and return the existing room.

## Security and Abuse Controls

- Enforce all private-start rules server-side.
- Do not trust frontend-provided room type, sender ID, points, or creator ID.
- Limit first-message content length and reuse the existing moderation policy for chat/private-message content.
- Do not expose the full user list as the primary private-message discovery mechanism. Forum surfaces should pass known recipient IDs, and chat search can remain scoped to existing conversations unless a later product decision opens user discovery.
- Keep admin chat management able to inspect and delete abusive rooms through existing admin chat surfaces.

## Migration Plan

1. Add nullable fields to support pair key and read tracking.
2. Backfill existing private rooms where exactly two members exist by computing the sorted pair key.
3. If duplicates exist for the same pair, keep the newest active room as canonical and leave older rooms without a private key for manual/admin cleanup.
4. Add unique index on `privateKey`.
5. Deploy backend compatibility first, then update UI entry points.

## Testing Plan

Unit and contract tests:

- User below 10000 cannot create a new private room.
- User with 10000 or more can create a private room and points are not deducted.
- Existing private room can be opened and messaged regardless of current points.
- Two users cannot create duplicate private rooms under concurrent requests.
- Admin can start a private room without meeting the threshold.
- General room creation cannot be used to bypass private-start rules.
- Private-message notification is created for the recipient.

Frontend/browser tests:

- Forum topic author private-message flow.
- Forum reply author private-message flow.
- Insufficient-points modal from forum.
- `/chat?roomId=<id>` opens the intended conversation.
- Mobile conversation list-to-detail navigation.
- Existing private reply sends without points warning.

Build checks:

- `git diff --check`
- focused Node tests for chat/private-message service
- `npm run build`
- browser verification for `/forum`, a topic page, and `/chat`

## Implementation Order

1. Add schema migration and generated client updates.
2. Add private-message eligibility and private-conversation services.
3. Add `/api/chat/private/start` and harden `/api/chat/rooms`.
4. Update message creation and socket events for private notifications.
5. Rebuild chat page around the inbox layout.
6. Add forum private-message actions and modal.
7. Add admin points-task config for the 10000 threshold.
8. Add tests and run browser verification.

## Acceptance Criteria

- A logged-in user with fewer than 10000 effective points cannot start a new private conversation.
- A logged-in user with at least 10000 effective points can start a new private conversation without any point deduction.
- A user can reply in an existing private conversation even below 10000 points.
- Forum topic and reply authors can be messaged from the forum UI.
- `/chat` works as a private-message inbox and still supports group/public rooms.
- Private-message notifications appear in the notification center.
- Duplicate private rooms are prevented by backend constraints.
