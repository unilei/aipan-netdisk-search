-- CreateTable
CREATE TABLE "ForumCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForumCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumTopic" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isSticky" BOOLEAN NOT NULL DEFAULT false,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "categoryId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "lastReplyId" INTEGER,
    "lastReplyAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForumTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumReply" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "topicId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "parentId" INTEGER,
    "isAccepted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForumReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumLike" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "topicId" INTEGER,
    "replyId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForumLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ForumCategory_name_key" ON "ForumCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ForumCategory_slug_key" ON "ForumCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ForumTopic_slug_key" ON "ForumTopic"("slug");

-- CreateIndex
CREATE INDEX "ForumTopic_categoryId_idx" ON "ForumTopic"("categoryId");

-- CreateIndex
CREATE INDEX "ForumTopic_authorId_idx" ON "ForumTopic"("authorId");

-- CreateIndex
CREATE INDEX "ForumTopic_isSticky_createdAt_idx" ON "ForumTopic"("isSticky", "createdAt");

-- CreateIndex
CREATE INDEX "ForumReply_topicId_idx" ON "ForumReply"("topicId");

-- CreateIndex
CREATE INDEX "ForumReply_authorId_idx" ON "ForumReply"("authorId");

-- CreateIndex
CREATE INDEX "ForumReply_parentId_idx" ON "ForumReply"("parentId");

-- CreateIndex
CREATE INDEX "ForumLike_userId_idx" ON "ForumLike"("userId");

-- CreateIndex
CREATE INDEX "ForumLike_topicId_idx" ON "ForumLike"("topicId");

-- CreateIndex
CREATE INDEX "ForumLike_replyId_idx" ON "ForumLike"("replyId");

-- CreateIndex
CREATE UNIQUE INDEX "ForumLike_userId_topicId_replyId_key" ON "ForumLike"("userId", "topicId", "replyId");

-- AddForeignKey
ALTER TABLE "ForumTopic" ADD CONSTRAINT "ForumTopic_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumTopic" ADD CONSTRAINT "ForumTopic_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ForumCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumReply" ADD CONSTRAINT "ForumReply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumReply" ADD CONSTRAINT "ForumReply_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "ForumTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumReply" ADD CONSTRAINT "ForumReply_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ForumReply"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumLike" ADD CONSTRAINT "ForumLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumLike" ADD CONSTRAINT "ForumLike_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "ForumTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumLike" ADD CONSTRAINT "ForumLike_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "ForumReply"("id") ON DELETE CASCADE ON UPDATE CASCADE;
