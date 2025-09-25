-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "status" TEXT NOT NULL DEFAULT 'active',
    "avatarStyle" TEXT NOT NULL DEFAULT 'avataaars',
    "salt" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ResourceType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isUserType" BOOLEAN NOT NULL DEFAULT false,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "creatorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Resource" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "links" TEXT NOT NULL,
    "typeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "creatorId" INTEGER NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserResource" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "links" TEXT NOT NULL,
    "typeId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "size" INTEGER,
    "format" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "creatorId" INTEGER NOT NULL,

    CONSTRAINT "UserResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."system_settings" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "group" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."search_records" (
    "id" SERIAL NOT NULL,
    "keyword" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "lastSearchAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserVodConfig" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserVodConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "relatedId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChatRoom" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "creatorId" INTEGER NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "avatar" TEXT,

    CONSTRAINT "ChatRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChatRoomUser" (
    "userId" INTEGER NOT NULL,
    "roomId" INTEGER NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" TEXT NOT NULL DEFAULT 'member',

    CONSTRAINT "ChatRoomUser_pkey" PRIMARY KEY ("userId","roomId")
);

-- CreateTable
CREATE TABLE "public"."ChatMessage" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "roomId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "replyToId" INTEGER,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT NOT NULL DEFAULT 'text',
    "fileUrl" TEXT,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CheckIn" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "checkInDate" DATE NOT NULL,
    "points" INTEGER NOT NULL,
    "consecutiveDays" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PointsHistory" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "relatedId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointsHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NavigationCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NavigationCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NavigationItem" (
    "id" SERIAL NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "target" TEXT NOT NULL DEFAULT '_self',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NavigationItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "public"."User"("role");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "public"."User"("status");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "public"."User"("createdAt");

-- CreateIndex
CREATE INDEX "User_isVerified_idx" ON "public"."User"("isVerified");

-- CreateIndex
CREATE INDEX "User_points_idx" ON "public"."User"("points");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceType_name_key" ON "public"."ResourceType"("name");

-- CreateIndex
CREATE INDEX "ResourceType_creatorId_idx" ON "public"."ResourceType"("creatorId");

-- CreateIndex
CREATE INDEX "ResourceType_isUserType_idx" ON "public"."ResourceType"("isUserType");

-- CreateIndex
CREATE INDEX "ResourceType_isEnabled_idx" ON "public"."ResourceType"("isEnabled");

-- CreateIndex
CREATE INDEX "ResourceType_createdAt_idx" ON "public"."ResourceType"("createdAt");

-- CreateIndex
CREATE INDEX "Resource_creatorId_idx" ON "public"."Resource"("creatorId");

-- CreateIndex
CREATE INDEX "Resource_typeId_idx" ON "public"."Resource"("typeId");

-- CreateIndex
CREATE INDEX "Resource_createdAt_idx" ON "public"."Resource"("createdAt");

-- CreateIndex
CREATE INDEX "Resource_name_idx" ON "public"."Resource"("name");

-- CreateIndex
CREATE INDEX "UserResource_creatorId_idx" ON "public"."UserResource"("creatorId");

-- CreateIndex
CREATE INDEX "UserResource_typeId_idx" ON "public"."UserResource"("typeId");

-- CreateIndex
CREATE INDEX "UserResource_status_idx" ON "public"."UserResource"("status");

-- CreateIndex
CREATE INDEX "UserResource_createdAt_idx" ON "public"."UserResource"("createdAt");

-- CreateIndex
CREATE INDEX "UserResource_name_idx" ON "public"."UserResource"("name");

-- CreateIndex
CREATE INDEX "UserResource_format_idx" ON "public"."UserResource"("format");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "public"."system_settings"("key");

-- CreateIndex
CREATE INDEX "system_settings_group_idx" ON "public"."system_settings"("group");

-- CreateIndex
CREATE UNIQUE INDEX "search_records_keyword_key" ON "public"."search_records"("keyword");

-- CreateIndex
CREATE INDEX "search_records_count_idx" ON "public"."search_records"("count");

-- CreateIndex
CREATE INDEX "UserVodConfig_userId_idx" ON "public"."UserVodConfig"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "public"."Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "public"."Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "public"."Notification"("createdAt");

-- CreateIndex
CREATE INDEX "ChatRoom_creatorId_idx" ON "public"."ChatRoom"("creatorId");

-- CreateIndex
CREATE INDEX "ChatRoom_type_idx" ON "public"."ChatRoom"("type");

-- CreateIndex
CREATE INDEX "ChatRoomUser_userId_idx" ON "public"."ChatRoomUser"("userId");

-- CreateIndex
CREATE INDEX "ChatRoomUser_roomId_idx" ON "public"."ChatRoomUser"("roomId");

-- CreateIndex
CREATE INDEX "ChatMessage_userId_idx" ON "public"."ChatMessage"("userId");

-- CreateIndex
CREATE INDEX "ChatMessage_roomId_idx" ON "public"."ChatMessage"("roomId");

-- CreateIndex
CREATE INDEX "ChatMessage_createdAt_idx" ON "public"."ChatMessage"("createdAt");

-- CreateIndex
CREATE INDEX "ChatMessage_replyToId_idx" ON "public"."ChatMessage"("replyToId");

-- CreateIndex
CREATE INDEX "CheckIn_userId_idx" ON "public"."CheckIn"("userId");

-- CreateIndex
CREATE INDEX "CheckIn_checkInDate_idx" ON "public"."CheckIn"("checkInDate");

-- CreateIndex
CREATE INDEX "CheckIn_consecutiveDays_idx" ON "public"."CheckIn"("consecutiveDays");

-- CreateIndex
CREATE UNIQUE INDEX "CheckIn_userId_checkInDate_key" ON "public"."CheckIn"("userId", "checkInDate");

-- CreateIndex
CREATE INDEX "PointsHistory_userId_idx" ON "public"."PointsHistory"("userId");

-- CreateIndex
CREATE INDEX "PointsHistory_type_idx" ON "public"."PointsHistory"("type");

-- CreateIndex
CREATE INDEX "PointsHistory_createdAt_idx" ON "public"."PointsHistory"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NavigationCategory_name_key" ON "public"."NavigationCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "NavigationCategory_slug_key" ON "public"."NavigationCategory"("slug");

-- CreateIndex
CREATE INDEX "NavigationCategory_sortOrder_idx" ON "public"."NavigationCategory"("sortOrder");

-- CreateIndex
CREATE INDEX "NavigationCategory_isActive_idx" ON "public"."NavigationCategory"("isActive");

-- CreateIndex
CREATE INDEX "NavigationCategory_createdAt_idx" ON "public"."NavigationCategory"("createdAt");

-- CreateIndex
CREATE INDEX "NavigationItem_categoryId_idx" ON "public"."NavigationItem"("categoryId");

-- CreateIndex
CREATE INDEX "NavigationItem_sortOrder_idx" ON "public"."NavigationItem"("sortOrder");

-- CreateIndex
CREATE INDEX "NavigationItem_isActive_idx" ON "public"."NavigationItem"("isActive");

-- CreateIndex
CREATE INDEX "NavigationItem_createdAt_idx" ON "public"."NavigationItem"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."ResourceType" ADD CONSTRAINT "ResourceType_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Resource" ADD CONSTRAINT "Resource_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Resource" ADD CONSTRAINT "Resource_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "public"."ResourceType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserResource" ADD CONSTRAINT "UserResource_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserResource" ADD CONSTRAINT "UserResource_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "public"."ResourceType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserVodConfig" ADD CONSTRAINT "UserVodConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatRoom" ADD CONSTRAINT "ChatRoom_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatRoomUser" ADD CONSTRAINT "ChatRoomUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatRoomUser" ADD CONSTRAINT "ChatRoomUser_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatMessage" ADD CONSTRAINT "ChatMessage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatMessage" ADD CONSTRAINT "ChatMessage_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "public"."ChatMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CheckIn" ADD CONSTRAINT "CheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PointsHistory" ADD CONSTRAINT "PointsHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NavigationItem" ADD CONSTRAINT "NavigationItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."NavigationCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
