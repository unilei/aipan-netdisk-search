import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPrivateRoomKey,
  startPrivateConversation,
} from "../../server/services/chat/privateConversations.mjs";

const createFakePrisma = ({
  users = [],
  existingRoom = null,
  createdRoom = null,
} = {}) => {
  const calls = [];
  const messages = [];
  const notifications = [];
  const memberships = [];
  const rooms = [];
  const userById = new Map(users.map((user) => [user.id, user]));

  const client = {
    calls,
    messages,
    notifications,
    memberships,
    rooms,
    user: {
      findUnique: async (args) => {
        calls.push(["user.findUnique", args]);
        return userById.get(args.where.id) || null;
      },
    },
    chatRoom: {
      findUnique: async (args) => {
        calls.push(["chatRoom.findUnique", args]);
        if (existingRoom && args.where.privateKey === existingRoom.privateKey) {
          return existingRoom;
        }
        return null;
      },
      create: async (args) => {
        calls.push(["chatRoom.create", args]);
        const room = createdRoom || {
          id: 10,
          name: args.data.name,
          type: args.data.type,
          privateKey: args.data.privateKey,
          creatorId: args.data.creator.connect.id,
          updatedAt: new Date("2026-05-12T00:00:00Z"),
          users: [],
          messages: [],
        };
        rooms.push(room);
        return room;
      },
      update: async (args) => {
        calls.push(["chatRoom.update", args]);
        return { id: args.where.id, ...args.data };
      },
    },
    chatRoomUser: {
      createMany: async (args) => {
        calls.push(["chatRoomUser.createMany", args]);
        memberships.push(...args.data);
        return { count: args.data.length };
      },
    },
    chatMessage: {
      create: async (args) => {
        calls.push(["chatMessage.create", args]);
        const message = {
          id: 99,
          content: args.data.content,
          userId: args.data.user.connect.id,
          roomId: args.data.room.connect.id,
          createdAt: new Date("2026-05-12T00:00:01Z"),
          user: userById.get(args.data.user.connect.id),
        };
        messages.push(message);
        return message;
      },
    },
    notification: {
      create: async (args) => {
        calls.push(["notification.create", args]);
        const notification = { id: 77, ...args.data };
        notifications.push(notification);
        return notification;
      },
    },
    $transaction: async (callback) => callback(client),
  };

  return client;
};

test("buildPrivateRoomKey returns a stable sorted key", () => {
  assert.equal(buildPrivateRoomKey(48, 12), "12:48");
  assert.equal(buildPrivateRoomKey("12", "48"), "12:48");
  assert.throws(() => buildPrivateRoomKey(12, 12), /不能给自己发送私信/);
});

test("startPrivateConversation returns an existing room without checking points", async () => {
  const existingRoom = {
    id: 5,
    name: "private_2_8",
    type: "private",
    privateKey: "2:8",
    updatedAt: new Date("2026-05-12T00:00:00Z"),
    users: [
      { userId: 2, user: { id: 2, username: "sender", avatarStyle: "bottts", role: "user" } },
      { userId: 8, user: { id: 8, username: "recipient", avatarStyle: "avataaars", role: "user" } },
    ],
    messages: [],
  };
  const prisma = createFakePrisma({
    users: [{ id: 8, username: "recipient", avatarStyle: "avataaars", status: "active" }],
    existingRoom,
  });

  const result = await startPrivateConversation({
    actor: { id: 2, role: "user" },
    recipientId: 8,
    prismaClient: prisma,
    getPointsBreakdown: async () => {
      throw new Error("points should not be checked for existing conversations");
    },
  });

  assert.equal(result.created, false);
  assert.equal(result.room.id, 5);
  assert.equal(result.room.recipient.username, "recipient");
  assert.equal(prisma.messages.length, 0);
});

test("startPrivateConversation rejects new rooms below the eligibility threshold", async () => {
  const prisma = createFakePrisma({
    users: [{ id: 8, username: "recipient", avatarStyle: "avataaars", status: "active" }],
  });

  await assert.rejects(
    () =>
      startPrivateConversation({
        actor: { id: 2, role: "user" },
        recipientId: 8,
        prismaClient: prisma,
        getPointsBreakdown: async () => ({ effectivePoints: 9999 }),
      }),
    (error) => {
      assert.equal(error.statusCode, 403);
      assert.equal(error.data.requiredPoints, 10000);
      assert.equal(error.data.currentPoints, 9999);
      return true;
    },
  );

  assert.equal(prisma.rooms.length, 0);
  assert.equal(prisma.messages.length, 0);
});

test("startPrivateConversation creates a new private room and first message without deducting points", async () => {
  const prisma = createFakePrisma({
    users: [
      { id: 2, username: "sender", avatarStyle: "bottts", status: "active", role: "user" },
      { id: 8, username: "recipient", avatarStyle: "avataaars", status: "active", role: "user" },
    ],
  });

  const result = await startPrivateConversation({
    actor: { id: 2, username: "sender", role: "user" },
    recipientId: 8,
    content: "你好，想聊一下这个帖子。",
    prismaClient: prisma,
    getPointsBreakdown: async () => ({ effectivePoints: 10000 }),
  });

  assert.equal(result.created, true);
  assert.equal(result.room.privateKey, "2:8");
  assert.equal(result.room.recipient.id, 8);
  assert.equal(result.message.content, "你好，想聊一下这个帖子。");
  assert.equal(prisma.memberships.length, 2);
  assert.equal(prisma.notifications.length, 1);
  assert.equal(prisma.notifications[0].type, "private_message");
  assert.equal(
    prisma.calls.some(([name]) => name === "user.update" || name === "pointsHistory.create"),
    false,
  );
});
