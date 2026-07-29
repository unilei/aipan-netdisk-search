-- Permanently remove retired forum data and its remaining metadata.
BEGIN;

DELETE FROM "NavigationItem"
WHERE "path" IN ('/forum', '/user/forum', '/admin/forum')
   OR "path" LIKE '/forum/%'
   OR "path" LIKE '/user/forum/%'
   OR "path" LIKE '/admin/forum/%';

DELETE FROM "Notification"
WHERE "type" IN ('reply', 'topic');

DELETE FROM "Report"
WHERE "contentType" = 'topic';

-- Forum replies shared the generic 'post' report type with blog posts. Those
-- legacy report rows cannot be attributed safely, so leave them untouched.

ALTER TABLE "ChatRoom"
  DROP COLUMN IF EXISTS "sourceForumTopicId";

DROP TABLE IF EXISTS "ForumTopicReadState";
DROP TABLE IF EXISTS "ForumPost";
DROP TABLE IF EXISTS "ForumTopic";
DROP TABLE IF EXISTS "ForumCategory";

COMMIT;
