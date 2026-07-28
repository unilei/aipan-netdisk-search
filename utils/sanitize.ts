import { sanitizeHtmlContent } from "./sanitizeCore.mjs";

/**
 * 使用同一套 DOMPurify 策略清理 SSR 与客户端渲染的富文本。
 */
export const sanitizeHtml = (dirty: string): string =>
  sanitizeHtmlContent(dirty);
