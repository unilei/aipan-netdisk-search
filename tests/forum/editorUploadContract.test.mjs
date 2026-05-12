import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");

test("forum markdown editor starts without preview and uploads through shared image helper", () => {
  const editor = read("components/MarkdownEditor.vue");

  assert.match(editor, /:preview="preview"/);
  assert.match(editor, /default:\s*false/);
  assert.match(editor, /import\s+\{\s*uploadImages\s*\}\s+from\s+"~\/utils\/uploadImage"/);
  assert.match(editor, /const result = await uploadImages\(files\)/);
});

test("image upload helper sends multipart files with the login token", () => {
  const helper = read("utils/uploadImage.ts");

  assert.match(helper, /new FormData\(\)/);
  assert.match(helper, /formData\.append\('files', uploadFile\)/);
  assert.match(helper, /authorization:\s*`Bearer \$\{token\}`/);
  assert.doesNotMatch(helper, /fileToBase64/);
});

test("server image upload proxies validated images to free image hosts", () => {
  const route = read("server/api/upload/image.post.ts");
  const auth = read("server/middleware/auth.ts");

  assert.match(route, /https:\/\/catbox\.moe\/user\/api\.php/);
  assert.match(route, /https:\/\/uguu\.se\/upload/);
  assert.match(route, /formData\.append\("reqtype", "fileupload"\)/);
  assert.match(route, /formData\.append\("fileToUpload"/);
  assert.match(route, /formData\.append\("files\[\]"/);
  assert.match(route, /uploadToFreeImageHost/);
  assert.match(route, /readMultipartFormData\(event\)/);
  assert.match(route, /image\/webp/);
  assert.match(route, /MAX_IMAGE_SIZE = 5 \* 1024 \* 1024/);
  assert.match(auth, /startsWith\("\/api\/upload"\)/);
});
