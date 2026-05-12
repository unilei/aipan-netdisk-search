const CATBOX_UPLOAD_URL = "https://catbox.moe/user/api.php";
const UGUU_UPLOAD_URL = "https://uguu.se/upload";
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const sanitizeFileName = (fileName: string) =>
  fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "image";

const getUploadParts = async (event: any) => {
  const parts = await readMultipartFormData(event);
  return (parts || []).filter((part) => part.filename && part.data);
};

const uploadToCatbox = async (file: {
  filename?: string;
  type?: string;
  data: Buffer;
}) => {
  const formData = new FormData();
  const blob = new Blob([file.data], {
    type: file.type || "application/octet-stream",
  });

  formData.append("reqtype", "fileupload");
  formData.append("fileToUpload", blob, sanitizeFileName(file.filename || "image"));

  const response = await fetch(CATBOX_UPLOAD_URL, {
    method: "POST",
    body: formData,
  });
  const text = (await response.text()).trim();

  if (!response.ok || !/^https?:\/\/files\.catbox\.moe\/.+/i.test(text)) {
    throw new Error(text || "图床上传失败");
  }

  return text;
};

const uploadToUguu = async (file: {
  filename?: string;
  type?: string;
  data: Buffer;
}) => {
  const formData = new FormData();
  const blob = new Blob([file.data], {
    type: file.type || "application/octet-stream",
  });

  formData.append("files[]", blob, sanitizeFileName(file.filename || "image"));

  const response = await fetch(UGUU_UPLOAD_URL, {
    method: "POST",
    body: formData,
  });
  const result = await response.json().catch(() => null);
  const url = result?.files?.[0]?.url;

  if (!response.ok || !result?.success || !/^https?:\/\/.+/i.test(url || "")) {
    throw new Error(result?.description || result?.error || "备用图床上传失败");
  }

  return url;
};

const uploadToFreeImageHost = async (file: {
  filename?: string;
  type?: string;
  data: Buffer;
}) => {
  const errors = [];

  for (const upload of [uploadToCatbox, uploadToUguu]) {
    try {
      return await upload(file);
    } catch (error: any) {
      errors.push(error?.message || "上传失败");
    }
  }

  throw new Error(errors.filter(Boolean).join("; ") || "图片上传失败");
};

export default defineEventHandler(async (event) => {
  try {
    const files = await getUploadParts(event);

    if (files.length === 0) {
      return {
        code: 400,
        urls: [],
        errors: ["未找到要上传的图片"],
      };
    }

    const urls: string[] = [];
    const errors: string[] = [];

    for (const file of files) {
      const type = file.type || "";
      const name = file.filename || "图片";

      if (!ALLOWED_IMAGE_TYPES.has(type)) {
        errors.push(`${name}: 只支持 JPG、PNG、GIF、WEBP 格式的图片`);
        continue;
      }

      if (file.data.length > MAX_IMAGE_SIZE) {
        errors.push(`${name}: 图片大小不能超过 5MB`);
        continue;
      }

      try {
        urls.push(await uploadToFreeImageHost(file as any));
      } catch (error: any) {
        console.error("Free image host upload failed:", error);
        errors.push(`${name}: 图片上传失败`);
      }
    }

    return {
      code: urls.length > 0 ? 200 : 500,
      urls,
      errors,
    };
  } catch (error: any) {
    console.error("Upload API error:", error);
    return {
      code: error.statusCode || 500,
      urls: [],
      errors: [error.message || "上传服务异常"],
    };
  }
});
