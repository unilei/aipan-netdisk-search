-- Remove links to features retired from the public site.
DELETE FROM "NavigationItem"
WHERE "path" IN (
  '/beat-prints',
  '/spring-festival',
  '/screen',
  '/suno',
  '/nav',
  '/forum',
  '/user/forum',
  '/admin/forum'
)
OR "path" LIKE '/screen/%'
OR "path" LIKE '/forum/%'
OR "path" LIKE '/user/forum/%'
OR "path" LIKE '/admin/forum/%';
