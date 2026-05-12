import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

test("chat schema includes private conversation metadata and read tracking", () => {
  const schema = read("prisma/schema.prisma");

  assert.match(schema, /privateKey\s+String\?\s+@unique/);
  assert.match(schema, /lastMessageAt\s+DateTime\?/);
  assert.match(schema, /sourceForumTopicId\s+Int\?/);
  assert.match(schema, /lastReadAt\s+DateTime\?/);
  assert.match(schema, /@@index\(\[lastMessageAt\]\)/);
});

test("private message metadata migration is present", () => {
  const migrationPath = new URL(
    "../../prisma/migrations/20260512110000_add_private_message_metadata/migration.sql",
    import.meta.url,
  );
  assert.equal(existsSync(migrationPath), true);
  const migration = read("prisma/migrations/20260512110000_add_private_message_metadata/migration.sql");

  assert.match(migration, /ALTER TABLE "ChatRoom" ADD COLUMN "privateKey"/);
  assert.match(migration, /CREATE UNIQUE INDEX "ChatRoom_privateKey_key"/);
  assert.match(migration, /ALTER TABLE "ChatRoomUser" ADD COLUMN "lastReadAt"/);
});

test("private start endpoint delegates to the private conversation service", () => {
  const endpoint = read("server/api/chat/private/start.post.ts");

  assert.match(endpoint, /startPrivateConversation/);
  assert.match(endpoint, /getStoredPrivateMessageConfig/);
  assert.match(endpoint, /io\.to\(`user:\$\{recipientId\}`\)/);
});

test("generic room creation cannot bypass private message eligibility", () => {
  const endpoint = read("server/api/chat/rooms/index.post.ts");

  assert.match(endpoint, /type\s*===\s*['"]private['"]/);
  assert.match(endpoint, /私信入口/);
});

test("room list and message endpoints expose inbox state", () => {
  const rooms = read("server/api/chat/rooms/index.get.ts");
  const messages = read("server/api/chat/messages/index.post.ts");
  const history = read("server/api/chat/rooms/[id]/messages.get.ts");

  assert.match(rooms, /unreadCount/);
  assert.match(rooms, /lastMessage/);
  assert.match(rooms, /recipient/);
  assert.match(messages, /lastMessageAt/);
  assert.match(messages, /private_message/);
  assert.match(messages, /notification\.create/);
  assert.match(history, /lastReadAt/);
  assert.match(history, /chatRoomUser\.update/);
});

test("socket no longer creates private rooms through a separate private_message path", () => {
  const socket = read("server/plugins/socket.ts");

  assert.doesNotMatch(socket, /socket\.on\(['"]private_message['"]/);
});

test("screen sharing socket events do not reuse chat room event names", () => {
  const socket = read("server/plugins/socket.ts");
  const screenSharing = read("composables/useScreenSharing.ts");

  assert.equal((socket.match(/socket\.on\(['"]join_room['"]/g) || []).length, 1);
  assert.equal((socket.match(/socket\.on\(['"]leave_room['"]/g) || []).length, 1);
  assert.match(socket, /socket\.on\(['"]screen:join_room['"]/);
  assert.match(socket, /socket\.emit\(['"]screen:error['"], \{ message: ['"]房间不存在或已关闭['"] \}/);

  assert.match(screenSharing, /emit\(['"]screen:join_room['"]/);
  assert.match(screenSharing, /emit\(['"]screen:create_room['"]/);
  assert.doesNotMatch(screenSharing, /emit\(['"]join_room['"]/);
  assert.doesNotMatch(screenSharing, /emit\(['"]create_room['"]/);
});

test("admin points page exposes private message threshold config", () => {
  const endpoint = read("server/api/admin/points/private-message.ts");
  const page = read("pages/admin/points/tasks.vue");

  assert.match(endpoint, /getStoredPrivateMessageConfig/);
  assert.match(endpoint, /saveStoredPrivateMessageConfig/);
  assert.match(page, /privateMessageMinimumPoints/);
  assert.match(page, /私信发起门槛/);
  assert.match(page, /\/api\/admin\/points\/private-message/);
});
